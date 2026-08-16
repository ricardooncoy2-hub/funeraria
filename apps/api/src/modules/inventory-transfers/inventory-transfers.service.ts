import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class InventoryTransfersService {
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
    const where = {
      OR: [{ sedeOrigenId: { in: sedeIds } }, { sedeDestinoId: { in: sedeIds } }],
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransfer.findMany({
        where,
        include: {
          sedeOrigen: { select: { id: true, codigo: true } },
          sedeDestino: { select: { id: true, codigo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.inventoryTransfer.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({
      where: { id, deletedAt: null },
      include: {
        sedeOrigen: { select: { id: true, codigo: true, nombre: true } },
        sedeDestino: { select: { id: true, codigo: true, nombre: true } },
        items: { include: { producto: { select: { id: true, codigo: true, nombre: true } } } },
      },
    });
    if (!transfer)
      throw new NotFoundException({
        code: 'TRANSFERENCIA_NO_ENCONTRADA',
        message: 'Transferencia no encontrada.',
      });
    if (
      !this.sedeScopeService.hasSedeAccess(user, transfer.sedeOrigenId) &&
      !this.sedeScopeService.hasSedeAccess(user, transfer.sedeDestinoId)
    ) {
      this.sedeScopeService.assertSedeAccess(user, transfer.sedeOrigenId);
    }
    return transfer;
  }

  /** RF-060/065: solicitud de transferencia (aún sin efecto en inventario). */
  async create(user: AuthenticatedUser, dto: CreateTransferDto) {
    const sedeOrigenId = BigInt(dto.sedeOrigenId);
    const sedeDestinoId = BigInt(dto.sedeDestinoId);

    if (sedeOrigenId === sedeDestinoId) {
      throw new BadRequestException({
        code: 'SEDE_ORIGEN_DESTINO_IGUAL',
        message: 'La sede origen y destino no pueden ser la misma (docs/19 §19.2).',
      });
    }
    this.sedeScopeService.assertSedeAccess(user, sedeOrigenId);

    const [origen, destino] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { id: sedeOrigenId, isActive: true, deletedAt: null },
      }),
      this.prisma.branch.findFirst({
        where: { id: sedeDestinoId, isActive: true, deletedAt: null },
      }),
    ]);
    if (!origen || !destino) {
      throw new NotFoundException({
        code: 'SEDE_NO_ENCONTRADA',
        message: 'Sede origen o destino no encontrada o inactiva.',
      });
    }

    const productoIds = dto.items.map((i) => BigInt(i.productoId));
    const found = await this.prisma.product.count({
      where: { id: { in: productoIds }, deletedAt: null },
    });
    if (found !== new Set(productoIds.map(String)).size) {
      throw new BadRequestException({
        code: 'PRODUCTO_NO_ENCONTRADO',
        message: 'Uno o más productos no existen.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const codigo = await this.generateCode(tx, origen.codigo);
      return tx.inventoryTransfer.create({
        data: {
          codigo,
          sedeOrigenId,
          sedeDestinoId,
          estado: 'SOLICITADA',
          motivo: dto.motivo,
          usuarioSolicitaId: user.id,
          fechaSolicitud: new Date(),
          items: {
            create: dto.items.map((item) => ({
              productoId: BigInt(item.productoId),
              cantidad: item.cantidad,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async aprobar(user: AuthenticatedUser, id: bigint) {
    const transfer = await this.findOne(user, id);
    this.sedeScopeService.assertSedeAccess(user, transfer.sedeOrigenId);
    this.assertState(transfer.estado, ['SOLICITADA'], 'aprobar');
    return this.prisma.inventoryTransfer.update({
      where: { id },
      data: { estado: 'APROBADA', usuarioApruebaId: user.id },
    });
  }

  /** docs/19 §19.2: ENVIADA (transacción) — salida en origen, valida stock (RB-025), transfiere costo. */
  async enviar(user: AuthenticatedUser, id: bigint) {
    const transfer = await this.findOne(user, id);
    this.sedeScopeService.assertSedeAccess(user, transfer.sedeOrigenId);
    this.assertState(transfer.estado, ['APROBADA'], 'enviar');

    return this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const result = await this.inventoryService.applyMovement(tx, {
          sedeId: transfer.sedeOrigenId,
          productoId: item.productoId,
          tipo: 'TRANSFERENCIA_SALIDA',
          cantidad: item.cantidad,
          documentoTipo: 'TRANSFERENCIA',
          documentoId: transfer.id,
          usuarioId: user.id,
        });
        // Snapshot del costo de origen para aplicarlo en destino al recibir.
        await tx.inventoryTransferItem.update({
          where: { id: item.id },
          data: { costoUnitario: result.costoPromedio },
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: { estado: 'ENVIADA', usuarioEnviaId: user.id, fechaEnvio: new Date() },
        include: { items: true },
      });
    });
  }

  /** docs/19 §19.2: RECIBIDA (transacción) — entrada en destino con el costo transferido. */
  async recibir(user: AuthenticatedUser, id: bigint) {
    const transfer = await this.findOne(user, id);
    this.sedeScopeService.assertSedeAccess(user, transfer.sedeDestinoId);
    this.assertState(transfer.estado, ['ENVIADA'], 'recibir');

    return this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        await this.inventoryService.applyMovement(tx, {
          sedeId: transfer.sedeDestinoId,
          productoId: item.productoId,
          tipo: 'TRANSFERENCIA_ENTRADA',
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario ?? undefined,
          documentoTipo: 'TRANSFERENCIA',
          documentoId: transfer.id,
          usuarioId: user.id,
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: { estado: 'RECIBIDA', usuarioRecibeId: user.id, fechaRecepcion: new Date() },
        include: { items: true },
      });
    });
  }

  /** docs/19 §19.2: cancelar solo antes de ENVIADA. */
  async cancelar(user: AuthenticatedUser, id: bigint) {
    const transfer = await this.findOne(user, id);
    this.sedeScopeService.assertSedeAccess(user, transfer.sedeOrigenId);
    this.assertState(transfer.estado, ['SOLICITADA', 'APROBADA'], 'cancelar');
    return this.prisma.inventoryTransfer.update({ where: { id }, data: { estado: 'CANCELADA' } });
  }

  private assertState(actual: string, allowed: readonly string[], accion: string): void {
    if (!allowed.includes(actual)) {
      throw new ConflictException({
        code: 'TRANSFERENCIA_ESTADO_INVALIDO',
        message: `No se puede ${accion} una transferencia en estado ${actual}.`,
      });
    }
  }

  private async generateCode(tx: PrismaTransaction, sedeOrigenCodigo: string): Promise<string> {
    const year = new Date().getFullYear();
    // codigo es VARCHAR(30) (docs/10 §10.8): "TRF-" + 8 + "-" + 4 + "-" + 6 = 24 máx.
    const sedePart = sedeOrigenCodigo.slice(0, 8);
    const prefix = `TRF-${sedePart}-${year}-`;
    const count = await tx.inventoryTransfer.count({ where: { codigo: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
}
