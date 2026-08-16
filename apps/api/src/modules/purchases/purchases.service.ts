import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { SedeScopeService } from '../authz/sede-scope.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const sedeIds = await this.sedeScopeService.authorizedSedeIds(user);
    const where: Prisma.PurchaseWhereInput = { sedeId: { in: sedeIds }, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          proveedor: { select: { id: true, razonSocial: true } },
          branch: { select: { id: true, codigo: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        proveedor: true,
        branch: { select: { id: true, codigo: true, nombre: true } },
        items: { include: { producto: { select: { id: true, codigo: true, nombre: true } } } },
      },
    });
    if (!purchase)
      throw new NotFoundException({
        code: 'COMPRA_NO_ENCONTRADA',
        message: 'Compra no encontrada.',
      });
    this.sedeScopeService.assertSedeAccess(user, purchase.sedeId);
    return purchase;
  }

  /** RB-001/RF-054: solo la sede principal compra, salvo compras_descentralizadas=true. */
  async create(user: AuthenticatedUser, dto: CreatePurchaseDto) {
    const sede = await this.resolvePurchaseBranch();
    this.sedeScopeService.assertSedeAccess(user, sede.id);

    const proveedor = await this.prisma.supplier.findFirst({
      where: { id: BigInt(dto.proveedorId), deletedAt: null },
    });
    if (!proveedor)
      throw new NotFoundException({
        code: 'PROVEEDOR_NO_ENCONTRADO',
        message: 'Proveedor no encontrado.',
      });

    await this.assertProductsExist(dto.items.map((i) => BigInt(i.productoId)));

    const { subtotal, igv, total, itemsData } = await this.computeTotals(dto.items);

    return this.prisma.purchase.create({
      data: {
        sedeId: sede.id,
        proveedorId: proveedor.id,
        numeroDocumento: dto.numeroDocumento,
        fecha: new Date(dto.fecha),
        subtotal,
        igv,
        total,
        estado: 'BORRADOR',
        usuarioId: user.id,
        observaciones: dto.observaciones,
        items: { create: itemsData },
      },
      include: { items: true },
    });
  }

  async update(user: AuthenticatedUser, id: bigint, dto: UpdatePurchaseDto) {
    const purchase = await this.findOne(user, id);
    if (purchase.estado !== 'BORRADOR') {
      throw new ConflictException({
        code: 'COMPRA_NO_EDITABLE',
        message: 'Solo se puede editar una compra en BORRADOR.',
      });
    }

    if (dto.proveedorId) {
      const proveedor = await this.prisma.supplier.findFirst({
        where: { id: BigInt(dto.proveedorId), deletedAt: null },
      });
      if (!proveedor)
        throw new NotFoundException({
          code: 'PROVEEDOR_NO_ENCONTRADO',
          message: 'Proveedor no encontrado.',
        });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await this.assertProductsExist(dto.items.map((i) => BigInt(i.productoId)));
        const { subtotal, igv, total, itemsData } = await this.computeTotals(dto.items);
        await tx.purchaseItem.deleteMany({ where: { compraId: id } });
        await tx.purchaseItem.createMany({
          data: itemsData.map((item) => ({ compraId: id, ...item })),
        });
        return tx.purchase.update({
          where: { id },
          data: {
            proveedorId: dto.proveedorId ? BigInt(dto.proveedorId) : undefined,
            numeroDocumento: dto.numeroDocumento,
            fecha: dto.fecha ? new Date(dto.fecha) : undefined,
            observaciones: dto.observaciones,
            subtotal,
            igv,
            total,
          },
          include: { items: true },
        });
      }
      return tx.purchase.update({
        where: { id },
        data: {
          proveedorId: dto.proveedorId ? BigInt(dto.proveedorId) : undefined,
          numeroDocumento: dto.numeroDocumento,
          fecha: dto.fecha ? new Date(dto.fecha) : undefined,
          observaciones: dto.observaciones,
        },
        include: { items: true },
      });
    });
  }

  /** docs/19 §19.1: recepción transaccional, efecto en inventario + recálculo de costo (RC-001). */
  async recepcionar(user: AuthenticatedUser, id: bigint) {
    const purchase = await this.findOne(user, id);
    if (purchase.estado !== 'BORRADOR') {
      throw new ConflictException({
        code: 'COMPRA_NO_RECEPCIONABLE',
        message: 'Solo una compra en BORRADOR puede recepcionarse.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        await this.inventoryService.applyMovement(tx, {
          sedeId: purchase.sedeId,
          productoId: item.productoId,
          tipo: 'COMPRA',
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          documentoTipo: 'COMPRA',
          documentoId: purchase.id,
          usuarioId: user.id,
        });
      }
      return tx.purchase.update({
        where: { id },
        data: { estado: 'RECIBIDA' },
        include: { items: true },
      });
    });
  }

  /** Solo desde BORRADOR (no RF de reversión de compra RECIBIDA en el alcance actual). */
  async anular(user: AuthenticatedUser, id: bigint) {
    const purchase = await this.findOne(user, id);
    if (purchase.estado !== 'BORRADOR') {
      throw new ConflictException({
        code: 'COMPRA_NO_ANULABLE',
        message: 'Solo una compra en BORRADOR puede anularse.',
      });
    }
    return this.prisma.purchase.update({ where: { id }, data: { estado: 'ANULADA' } });
  }

  private async resolvePurchaseBranch() {
    const config = await this.prisma.companyConfig.findUnique({ where: { id: 1n } });
    const principal = await this.prisma.branch.findFirst({
      where: { isMain: true, isActive: true, deletedAt: null },
    });
    if (!principal) {
      throw new ConflictException({
        code: 'SIN_SEDE_PRINCIPAL',
        message: 'No hay una sede principal activa configurada.',
      });
    }
    if (!config?.comprasDescentralizadas) return principal;
    // compras_descentralizadas=true: v1 solo habilita el flag; la selección de
    // sede distinta a la principal se implementará junto con el flujo de UI
    // correspondiente (no hay RF que lo pida en el alcance actual).
    return principal;
  }

  private async assertProductsExist(productoIds: bigint[]): Promise<void> {
    const found = await this.prisma.product.count({
      where: { id: { in: productoIds }, deletedAt: null },
    });
    if (found !== new Set(productoIds.map(String)).size) {
      throw new BadRequestException({
        code: 'PRODUCTO_NO_ENCONTRADO',
        message: 'Uno o más productos no existen.',
      });
    }
  }

  private async computeTotals(items: CreatePurchaseDto['items']) {
    const config = await this.prisma.companyConfig.findUnique({ where: { id: 1n } });
    const igvPorcentaje = config?.igvPorcentaje ?? new Prisma.Decimal(18);

    let subtotal = new Prisma.Decimal(0);
    let igv = new Prisma.Decimal(0);
    const itemsData = items.map((item) => {
      const cantidad = new Prisma.Decimal(item.cantidad);
      const costoUnitario = new Prisma.Decimal(item.costoUnitario);
      const lineSubtotal = cantidad.mul(costoUnitario);
      const afectoIgv = item.afectoIgv ?? true;
      const lineIgv = afectoIgv ? lineSubtotal.mul(igvPorcentaje).div(100) : new Prisma.Decimal(0);
      subtotal = subtotal.add(lineSubtotal);
      igv = igv.add(lineIgv);
      return {
        productoId: BigInt(item.productoId),
        cantidad,
        costoUnitario,
        subtotal: lineSubtotal,
        afectoIgv,
      };
    });

    return { subtotal, igv, total: subtotal.add(igv), itemsData };
  }
}
