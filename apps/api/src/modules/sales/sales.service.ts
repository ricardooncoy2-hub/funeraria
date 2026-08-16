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
import { PrismaTransaction } from '../inventory/stock-movement.types';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleItemDto } from './dto/sale-item.dto';
import { VoidSaleDto } from './dto/void-sale.dto';

interface ResolvedLine {
  itemTipo: 'PRODUCTO' | 'SERVICIO' | 'PLAN';
  productoId: bigint | null;
  servicioId: bigint | null;
  planId: bigint | null;
  descripcion: string;
  cantidad: Prisma.Decimal;
  precioUnitario: Prisma.Decimal;
  descuentoLinea: Prisma.Decimal;
  afectoIgv: boolean;
  subtotal: Prisma.Decimal;
  /** Productos a descontar de inventario (línea directa o componentes del plan, docs/20 §20.5). */
  stockDeductions: { productoId: bigint; cantidad: Prisma.Decimal }[];
}

@Injectable()
export class SalesService {
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
    const where: Prisma.SaleWhereInput = { sedeVentaId: { in: sedeIds }, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombres: true, apellidos: true } },
          sedeVenta: { select: { id: true, codigo: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: true,
        sedeVenta: { select: { id: true, codigo: true, nombre: true } },
        vendedor: { select: { id: true, nombres: true, apellidos: true } },
        items: true,
        contractedServices: true,
        financings: true,
        payments: true,
      },
    });
    if (!sale)
      throw new NotFoundException({ code: 'VENTA_NO_ENCONTRADA', message: 'Venta no encontrada.' });
    this.sedeScopeService.assertSedeAccess(user, sale.sedeVentaId);
    return sale;
  }

  /** docs/20 §20.5: transacción completa — detalle, stock, financiamiento, servicios contratados. */
  async create(user: AuthenticatedUser, dto: CreateSaleDto, cotizacionId?: bigint) {
    const sedeVentaId = BigInt(dto.sedeVentaId);
    this.sedeScopeService.assertSedeAccess(user, sedeVentaId);

    const cliente = await this.prisma.customer.findFirst({
      where: { id: BigInt(dto.clienteId), deletedAt: null },
    });
    if (!cliente)
      throw new NotFoundException({
        code: 'CLIENTE_NO_ENCONTRADO',
        message: 'Cliente no encontrado.',
      });

    const branch = await this.prisma.branch.findFirst({
      where: { id: sedeVentaId, isActive: true, deletedAt: null },
    });
    if (!branch)
      throw new NotFoundException({
        code: 'SEDE_NO_ENCONTRADA',
        message: 'Sede de venta no encontrada o inactiva.',
      });

    const config = await this.prisma.companyConfig.findUnique({ where: { id: 1n } });
    const igvPorcentaje = config?.igvPorcentaje ?? new Prisma.Decimal(18);

    const lines = await Promise.all(dto.items.map((item) => this.resolveLine(sedeVentaId, item)));

    let subtotal = new Prisma.Decimal(0);
    let subtotalAfecto = new Prisma.Decimal(0);
    for (const line of lines) {
      subtotal = subtotal.add(line.subtotal);
      if (line.afectoIgv) subtotalAfecto = subtotalAfecto.add(line.subtotal);
    }
    const descuentoGlobal = new Prisma.Decimal(dto.descuentoGlobal ?? 0);
    const baseImponible = Prisma.Decimal.max(subtotalAfecto.sub(descuentoGlobal), 0);
    const igv = baseImponible.mul(igvPorcentaje).div(100);
    const total = subtotal.sub(descuentoGlobal).add(igv);

    const saleId = await this.prisma.$transaction(async (tx) => {
      const codigo = await this.generateCode(tx, branch.codigo);

      const sale = await tx.sale.create({
        data: {
          codigo,
          sedeVentaId,
          clienteId: cliente.id,
          usuarioId: user.id,
          cotizacionId,
          subtotal,
          descuento: descuentoGlobal,
          baseImponible,
          igv,
          total,
          estado: 'CONFIRMADA',
          observaciones: dto.observaciones,
          items: {
            create: lines.map((line) => ({
              itemTipo: line.itemTipo,
              productoId: line.productoId,
              servicioId: line.servicioId,
              planId: line.planId,
              descripcion: line.descripcion,
              cantidad: line.cantidad,
              precioUnitario: line.precioUnitario,
              descuentoLinea: line.descuentoLinea,
              afectoIgv: line.afectoIgv,
              subtotal: line.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // RB-021: por ahora un único financiamiento CLIENTE = total (financiadores
      // institucionales llegan en Fase 4).
      await tx.financing.create({
        data: {
          ventaId: sale.id,
          origenTipo: 'CLIENTE',
          clienteId: cliente.id,
          monto: total,
          estado: 'PENDIENTE',
        },
      });

      if (dto.serviciosContratados) {
        for (const cs of dto.serviciosContratados) {
          await tx.contractedService.create({
            data: {
              ventaId: sale.id,
              sedeId: sedeVentaId,
              tipoServicio: cs.tipoServicio,
              fechaServicio: cs.fechaServicio ? new Date(cs.fechaServicio) : undefined,
              lugar: cs.lugar,
              responsableUsuarioId: cs.responsableUsuarioId
                ? BigInt(cs.responsableUsuarioId)
                : undefined,
              observaciones: cs.observaciones,
            },
          });
        }
      }

      for (const line of lines) {
        for (const deduction of line.stockDeductions) {
          await this.inventoryService.applyMovement(tx, {
            sedeId: sedeVentaId,
            productoId: deduction.productoId,
            tipo: 'VENTA',
            cantidad: deduction.cantidad,
            documentoTipo: 'VENTA',
            documentoId: sale.id,
            usuarioId: user.id,
          });
        }
      }

      return sale.id;
    });

    return this.findOne(user, saleId);
  }

  /** docs/20 §20.7 (RB-020/028): reversión de inventario + trazabilidad, sin borrado físico. */
  async anular(user: AuthenticatedUser, id: bigint, dto: VoidSaleDto) {
    const sale = await this.findOne(user, id);
    if (sale.estado !== 'CONFIRMADA') {
      throw new ConflictException({
        code: 'VENTA_NO_ANULABLE',
        message: 'Solo una venta CONFIRMADA puede anularse.',
      });
    }

    const pagosConfirmados = await this.prisma.payment.count({
      where: { ventaId: id, estado: 'CONFIRMADO' },
    });
    if (pagosConfirmados > 0) {
      throw new ConflictException({
        code: 'VENTA_CON_PAGOS_CONFIRMADOS',
        message:
          'La venta tiene pagos confirmados; anúlelos o gestione la devolución antes de anular la venta.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const items = await tx.saleItem.findMany({ where: { ventaId: id } });
      const deductions = await this.expandStockDeductions(items);

      for (const deduction of deductions) {
        await this.inventoryService.applyMovement(tx, {
          sedeId: sale.sedeVentaId,
          productoId: deduction.productoId,
          tipo: 'ANULACION_VENTA',
          cantidad: deduction.cantidad,
          documentoTipo: 'VENTA',
          documentoId: id,
          usuarioId: user.id,
        });
      }

      await tx.financing.updateMany({ where: { ventaId: id }, data: { estado: 'CANCELADA' } });

      return tx.sale.update({
        where: { id },
        data: {
          estado: 'ANULADA',
          anuladaMotivo: dto.motivo,
          anuladaPor: user.id,
          anuladaAt: new Date(),
        },
      });
    });
  }

  /** docs/20 §20.8 */
  async estadoCuenta(user: AuthenticatedUser, id: bigint) {
    const sale = await this.findOne(user, id);
    const financiado = sale.financings.reduce((acc, f) => acc.add(f.monto), new Prisma.Decimal(0));
    const cobrado = sale.payments
      .filter((p) => p.estado === 'CONFIRMADO')
      .reduce((acc, p) => acc.add(p.monto), new Prisma.Decimal(0));

    return {
      total: sale.total,
      financiado,
      cobrado,
      porCobrar: financiado.sub(cobrado),
      porFinanciador: sale.financings.map((f) => {
        const cobradoFinanciador = sale.payments
          .filter((p) => p.financiamientoId === f.id && p.estado === 'CONFIRMADO')
          .reduce((acc, p) => acc.add(p.monto), new Prisma.Decimal(0));
        return {
          financiamientoId: f.id,
          origenTipo: f.origenTipo,
          monto: f.monto,
          cobrado: cobradoFinanciador,
          pendiente: f.monto.sub(cobradoFinanciador),
          estado: f.estado,
        };
      }),
    };
  }

  private async resolveLine(sedeVentaId: bigint, item: SaleItemDto): Promise<ResolvedLine> {
    const cantidad = new Prisma.Decimal(item.cantidad);
    const descuentoLinea = new Prisma.Decimal(item.descuentoLinea ?? 0);

    if (item.itemTipo === 'PRODUCTO') {
      const producto = await this.prisma.product.findFirst({
        where: { id: BigInt(item.productoId!), deletedAt: null },
      });
      if (!producto)
        throw new BadRequestException({
          code: 'PRODUCTO_NO_ENCONTRADO',
          message: 'Producto no encontrado.',
        });
      const subtotal = cantidad.mul(producto.precioVenta).sub(descuentoLinea);
      return {
        itemTipo: 'PRODUCTO',
        productoId: producto.id,
        servicioId: null,
        planId: null,
        descripcion: producto.nombre,
        cantidad,
        precioUnitario: producto.precioVenta,
        descuentoLinea,
        afectoIgv: producto.afectoIgv,
        subtotal,
        stockDeductions: [{ productoId: producto.id, cantidad }],
      };
    }

    if (item.itemTipo === 'SERVICIO') {
      const servicio = await this.prisma.service.findFirst({
        where: { id: BigInt(item.servicioId!), deletedAt: null },
      });
      if (!servicio)
        throw new BadRequestException({
          code: 'SERVICIO_NO_ENCONTRADO',
          message: 'Servicio no encontrado.',
        });
      const override = await this.prisma.branchService.findUnique({
        where: { sedeId_servicioId: { sedeId: sedeVentaId, servicioId: servicio.id } },
      });
      const precioUnitario = override?.precio ?? servicio.precioBase; // RB-029
      const subtotal = cantidad.mul(precioUnitario).sub(descuentoLinea);
      return {
        itemTipo: 'SERVICIO',
        productoId: null,
        servicioId: servicio.id,
        planId: null,
        descripcion: servicio.nombre,
        cantidad,
        precioUnitario,
        descuentoLinea,
        afectoIgv: servicio.afectoIgv,
        subtotal,
        stockDeductions: [],
      };
    }

    // PLAN
    const plan = await this.prisma.plan.findFirst({
      where: { id: BigInt(item.planId!), deletedAt: null },
      include: { items: true },
    });
    if (!plan)
      throw new BadRequestException({ code: 'PLAN_NO_ENCONTRADO', message: 'Plan no encontrado.' });
    const subtotal = cantidad.mul(plan.precio).sub(descuentoLinea);
    const stockDeductions = plan.items
      .filter((i) => i.itemTipo === 'PRODUCTO' && i.productoId)
      .map((i) => ({ productoId: i.productoId!, cantidad: i.cantidad.mul(cantidad) }));

    return {
      itemTipo: 'PLAN',
      productoId: null,
      servicioId: null,
      planId: plan.id,
      descripcion: plan.nombre,
      cantidad,
      precioUnitario: plan.precio,
      descuentoLinea,
      afectoIgv: plan.afectoIgv,
      subtotal,
      stockDeductions,
    };
  }

  /** Reconstruye las deducciones de stock de una venta ya confirmada (para anulación). */
  private async expandStockDeductions(
    items: {
      itemTipo: string;
      productoId: bigint | null;
      planId: bigint | null;
      cantidad: Prisma.Decimal;
    }[],
  ): Promise<{ productoId: bigint; cantidad: Prisma.Decimal }[]> {
    const result: { productoId: bigint; cantidad: Prisma.Decimal }[] = [];
    for (const item of items) {
      if (item.itemTipo === 'PRODUCTO' && item.productoId) {
        result.push({ productoId: item.productoId, cantidad: item.cantidad });
      } else if (item.itemTipo === 'PLAN' && item.planId) {
        const planItems = await this.prisma.planItem.findMany({
          where: { planId: item.planId, itemTipo: 'PRODUCTO' },
        });
        for (const pi of planItems) {
          if (pi.productoId)
            result.push({ productoId: pi.productoId, cantidad: pi.cantidad.mul(item.cantidad) });
        }
      }
    }
    return result;
  }

  private async generateCode(tx: PrismaTransaction, sedeVentaCodigo: string): Promise<string> {
    const year = new Date().getFullYear();
    const sedePart = sedeVentaCodigo.slice(0, 8);
    const prefix = `V-${sedePart}-${year}-`;
    const count = await tx.sale.count({ where: { codigo: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
}
