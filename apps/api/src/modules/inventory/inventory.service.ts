import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { SedeScopeService } from '../authz/sede-scope.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { KardexQueryDto } from './dto/kardex-query.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import {
  ApplyMovementParams,
  ApplyMovementResult,
  COST_RECALC_TYPES,
  ENTRY_TYPES,
  PrismaTransaction,
} from './stock-movement.types';

interface LockedInventoryRow {
  id: bigint;
  stock_actual: string;
  costo_promedio: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  /**
   * Núcleo transaccional del kardex (docs/18 §18.3). Debe invocarse SIEMPRE
   * dentro de un `prisma.$transaction`. Bloquea la fila de `inventarios` con
   * `SELECT ... FOR UPDATE` (RB-025, doc14 §14.8) para evitar condiciones de
   * carrera; rechaza con 409 si la salida dejaría stock negativo.
   */
  async applyMovement(
    tx: PrismaTransaction,
    params: ApplyMovementParams,
  ): Promise<ApplyMovementResult> {
    const cantidad = new Prisma.Decimal(params.cantidad);
    if (cantidad.lte(0)) {
      throw new BadRequestException({
        code: 'CANTIDAD_INVALIDA',
        message: 'La cantidad debe ser mayor a cero.',
      });
    }

    // Idempotente: crea la fila de inventario si aún no existe para (sede, producto).
    await tx.$executeRaw`
      INSERT INTO inventarios (sede_id, producto_id, stock_actual, stock_minimo, costo_promedio, created_at, updated_at)
      VALUES (${params.sedeId}, ${params.productoId}, 0, 0, 0, NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE id = id
    `;

    const rows = await tx.$queryRaw<LockedInventoryRow[]>`
      SELECT id, stock_actual, costo_promedio FROM inventarios
      WHERE sede_id = ${params.sedeId} AND producto_id = ${params.productoId}
      FOR UPDATE
    `;
    const row = rows[0];

    const stockAnterior = new Prisma.Decimal(row.stock_actual);
    const costoPromedioAnterior = new Prisma.Decimal(row.costo_promedio);
    const isEntry = ENTRY_TYPES.has(params.tipo);
    const stockPosterior = isEntry ? stockAnterior.add(cantidad) : stockAnterior.sub(cantidad);

    if (stockPosterior.lt(0)) {
      throw new ConflictException({
        code: 'STOCK_INSUFICIENTE',
        message: `Stock insuficiente: disponible ${stockAnterior.toString()}, solicitado ${cantidad.toString()}.`,
      });
    }

    let costoPromedio = costoPromedioAnterior;
    if (COST_RECALC_TYPES.has(params.tipo) && params.costoUnitario !== undefined) {
      const costoUnitario = new Prisma.Decimal(params.costoUnitario);
      const denominador = stockAnterior.add(cantidad);
      costoPromedio = denominador.isZero()
        ? costoUnitario
        : stockAnterior
            .mul(costoPromedioAnterior)
            .add(cantidad.mul(costoUnitario))
            .div(denominador);
    }

    await tx.inventory.update({
      where: { id: row.id },
      data: { stockActual: stockPosterior, costoPromedio },
    });

    await tx.inventoryMovement.create({
      data: {
        sedeId: params.sedeId,
        productoId: params.productoId,
        tipo: params.tipo,
        cantidad,
        costoUnitario:
          params.costoUnitario !== undefined ? new Prisma.Decimal(params.costoUnitario) : null,
        stockAnterior,
        stockPosterior,
        documentoTipo: params.documentoTipo,
        documentoId: params.documentoId,
        motivo: params.motivo,
        usuarioId: params.usuarioId,
      },
    });

    return { stockAnterior, stockPosterior, costoPromedio };
  }

  async findStock(
    user: AuthenticatedUser,
    query: StockQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const sedeIds = await this.resolveSedeIds(user, query.sedeId);
    const where: Prisma.InventoryWhereInput = {
      sedeId: { in: sedeIds },
      ...(query.productoId ? { productoId: BigInt(query.productoId) } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          branch: { select: { id: true, codigo: true, nombre: true } },
          producto: { select: { id: true, codigo: true, nombre: true } },
        },
        orderBy: [{ sedeId: 'asc' }, { productoId: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findLowStock(user: AuthenticatedUser, sedeIdParam?: string) {
    const sedeIds = await this.resolveSedeIds(user, sedeIdParam);
    const rows = await this.prisma.inventory.findMany({
      where: { sedeId: { in: sedeIds } },
      include: {
        branch: { select: { id: true, codigo: true, nombre: true } },
        producto: { select: { id: true, codigo: true, nombre: true } },
      },
    });
    return rows.filter((r) => r.stockActual.lte(r.stockMinimo));
  }

  async kardex(user: AuthenticatedUser, query: KardexQueryDto) {
    const sedeId = BigInt(query.sedeId);
    this.sedeScopeService.assertSedeAccess(user, sedeId);

    const where: Prisma.InventoryMovementWhereInput = {
      sedeId,
      productoId: BigInt(query.productoId),
      ...(query.desde || query.hasta
        ? {
            createdAt: {
              ...(query.desde ? { gte: new Date(query.desde) } : {}),
              ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** RF-045: ajustes/mermas manuales, motivo obligatorio, requiere inventario.ajustar. */
  async createAdjustment(user: AuthenticatedUser, dto: CreateAdjustmentDto) {
    const sedeId = BigInt(dto.sedeId);
    this.sedeScopeService.assertSedeAccess(user, sedeId);

    return this.prisma.$transaction((tx) =>
      this.applyMovement(tx, {
        sedeId,
        productoId: BigInt(dto.productoId),
        tipo: dto.tipo,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        documentoTipo: 'AJUSTE',
        usuarioId: user.id,
      }),
    );
  }

  private async resolveSedeIds(user: AuthenticatedUser, sedeIdParam?: string): Promise<bigint[]> {
    if (sedeIdParam) {
      const sedeId = BigInt(sedeIdParam);
      this.sedeScopeService.assertSedeAccess(user, sedeId);
      return [sedeId];
    }
    return this.sedeScopeService.authorizedSedeIds(user);
  }
}
