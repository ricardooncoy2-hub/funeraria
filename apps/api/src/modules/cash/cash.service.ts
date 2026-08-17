import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { SedeScopeService } from '../authz/sede-scope.service';
import { CashQueryDto } from './dto/cash-query.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { CreateCashDto } from './dto/create-cash.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { OpenCashDto } from './dto/open-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

const MOVIMIENTOS_INGRESO = new Set(['INGRESO', 'VENTA_EFECTIVO']);
const MOVIMIENTOS_EGRESO = new Set(['EGRESO', 'RETIRO']);
/** VENTA_EFECTIVO solo lo genera PaymentsService; el DTO ya lo excluye, pero
 * se valida también aquí porque el ValidationPipe global no corre en tests
 * e2e (se registra en main.ts, no vía APP_PIPE). */
const TIPOS_MOVIMIENTO_MANUAL = new Set(['INGRESO', 'EGRESO', 'RETIRO']);

@Injectable()
export class CashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  // --- Cajas ---

  async findAll(user: AuthenticatedUser, query: CashQueryDto): Promise<PaginatedResult<unknown>> {
    const sedeIds = query.sedeId
      ? [BigInt(query.sedeId)]
      : await this.sedeScopeService.authorizedSedeIds(user);
    if (query.sedeId) this.sedeScopeService.assertSedeAccess(user, BigInt(query.sedeId));

    const where: Prisma.CashWhereInput = {
      sedeId: { in: sedeIds },
      ...(query.q ? { nombre: { contains: query.q } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.cash.findMany({
        where,
        include: { openings: { where: { estado: 'ABIERTA' }, take: 1 } },
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.cash.count({ where }),
    ]);
    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const caja = await this.prisma.cash.findUnique({
      where: { id },
      include: { openings: { where: { estado: 'ABIERTA' }, take: 1 } },
    });
    if (!caja)
      throw new NotFoundException({ code: 'CAJA_NO_ENCONTRADA', message: 'Caja no encontrada.' });
    this.sedeScopeService.assertSedeAccess(user, caja.sedeId);
    return caja;
  }

  createCaja(dto: CreateCashDto) {
    return this.prisma.cash.create({
      data: { sedeId: BigInt(dto.sedeId), nombre: dto.nombre },
    });
  }

  async updateCaja(id: bigint, dto: UpdateCashDto) {
    await this.assertCajaExists(id);
    return this.prisma.cash.update({
      where: { id },
      data: {
        sedeId: dto.sedeId ? BigInt(dto.sedeId) : undefined,
        nombre: dto.nombre,
        isActive: dto.isActive,
      },
    });
  }

  // --- Aperturas ---

  /** docs/22 §22.6, RB-026: no se permiten dos aperturas simultáneas de la misma caja. */
  async abrir(user: AuthenticatedUser, cajaId: bigint, dto: OpenCashDto) {
    const caja = await this.prisma.cash.findFirst({ where: { id: cajaId, isActive: true } });
    if (!caja)
      throw new NotFoundException({ code: 'CAJA_NO_ENCONTRADA', message: 'Caja no encontrada.' });
    this.sedeScopeService.assertSedeAccess(user, caja.sedeId);

    const abierta = await this.prisma.cashOpening.findFirst({
      where: { cajaId, estado: 'ABIERTA' },
    });
    if (abierta)
      throw new ConflictException({
        code: 'CAJA_YA_ABIERTA',
        message: 'La caja ya tiene una apertura vigente.',
      });

    return this.prisma.cashOpening.create({
      data: {
        cajaId,
        sedeId: caja.sedeId,
        usuarioAperturaId: user.id,
        saldoInicial: new Prisma.Decimal(dto.saldoInicial),
      },
    });
  }

  async findOneApertura(user: AuthenticatedUser, id: bigint) {
    const apertura = await this.prisma.cashOpening.findUnique({ where: { id } });
    if (!apertura)
      throw new NotFoundException({
        code: 'APERTURA_NO_ENCONTRADA',
        message: 'Apertura de caja no encontrada.',
      });
    this.sedeScopeService.assertSedeAccess(user, apertura.sedeId);
    return apertura;
  }

  /** docs/22 §22.6: ingresos/egresos manuales durante la sesión. */
  async registrarMovimiento(
    user: AuthenticatedUser,
    aperturaId: bigint,
    dto: CreateCashMovementDto,
  ) {
    if (!TIPOS_MOVIMIENTO_MANUAL.has(dto.tipo)) {
      throw new BadRequestException({
        code: 'TIPO_MOVIMIENTO_INVALIDO',
        message: 'El tipo debe ser INGRESO, EGRESO o RETIRO.',
      });
    }

    const apertura = await this.findOneApertura(user, aperturaId);
    if (apertura.estado !== 'ABIERTA')
      throw new ConflictException({
        code: 'CAJA_NO_ABIERTA',
        message: 'La apertura de caja no está vigente.',
      });

    return this.prisma.cashMovement.create({
      data: {
        aperturaCajaId: apertura.id,
        cajaId: apertura.cajaId,
        sedeId: apertura.sedeId,
        tipo: dto.tipo,
        monto: new Prisma.Decimal(dto.monto),
        concepto: dto.concepto,
        usuarioId: user.id,
      },
    });
  }

  /** docs/22 §22.6: saldo_esperado = inicial + ingresos + venta_efectivo - egresos - retiros. */
  async cerrar(user: AuthenticatedUser, aperturaId: bigint, dto: CloseCashDto) {
    const apertura = await this.findOneApertura(user, aperturaId);
    if (apertura.estado !== 'ABIERTA')
      throw new ConflictException({
        code: 'APERTURA_YA_CERRADA',
        message: 'La apertura de caja ya está cerrada.',
      });

    return this.prisma.$transaction(async (tx) => {
      const saldoEsperado = await this.computeSaldoEsperado(tx, apertura.id, apertura.saldoInicial);
      const saldoContado = new Prisma.Decimal(dto.saldoContado);
      const diferencia = saldoContado.sub(saldoEsperado);

      return tx.cashOpening.update({
        where: { id: apertura.id },
        data: {
          estado: 'CERRADA',
          saldoEsperado,
          saldoContado,
          diferencia,
          usuarioCierreId: user.id,
          fechaCierre: new Date(),
        },
      });
    });
  }

  /** docs/22 §22.6: resumen disponible tanto en sesión ABIERTA como ya CERRADA. */
  async resumen(user: AuthenticatedUser, aperturaId: bigint) {
    const apertura = await this.findOneApertura(user, aperturaId);
    const movimientos = await this.prisma.cashMovement.groupBy({
      by: ['tipo'],
      where: { aperturaCajaId: apertura.id },
      _sum: { monto: true },
    });
    const totales = Object.fromEntries(
      movimientos.map((m) => [m.tipo, m._sum.monto ?? new Prisma.Decimal(0)]),
    );
    const saldoTeorico =
      apertura.estado === 'CERRADA' && apertura.saldoEsperado
        ? apertura.saldoEsperado
        : await this.computeSaldoEsperado(this.prisma, apertura.id, apertura.saldoInicial);

    return { apertura, totales, saldoTeorico };
  }

  private async computeSaldoEsperado(
    client: Prisma.TransactionClient | PrismaService,
    aperturaId: bigint,
    saldoInicial: Prisma.Decimal,
  ): Promise<Prisma.Decimal> {
    const movimientos = await client.cashMovement.groupBy({
      by: ['tipo'],
      where: { aperturaCajaId: aperturaId },
      _sum: { monto: true },
    });
    let saldo = saldoInicial;
    for (const m of movimientos) {
      const monto = m._sum.monto ?? new Prisma.Decimal(0);
      if (MOVIMIENTOS_INGRESO.has(m.tipo)) saldo = saldo.add(monto);
      else if (MOVIMIENTOS_EGRESO.has(m.tipo)) saldo = saldo.sub(monto);
    }
    return saldo;
  }

  private async assertCajaExists(id: bigint): Promise<void> {
    const exists = await this.prisma.cash.findUnique({ where: { id } });
    if (!exists)
      throw new NotFoundException({ code: 'CAJA_NO_ENCONTRADA', message: 'Caja no encontrada.' });
  }
}
