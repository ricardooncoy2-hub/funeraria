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
import { CreateDestinoPagoDto } from './dto/create-destino-pago.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateDestinoPagoDto } from './dto/update-destino-pago.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';

/**
 * docs/21 §21.4: PARCIALMENTE_PAGADA/PAGADA son automáticas en cualquier
 * financiamiento con pagos confirmados. Si el cobrado vuelve a 0 (pago
 * anulado), se restaura el punto de partida de cada ciclo: PENDIENTE para
 * el cliente, o el estado previo (típicamente APROBADA) para un
 * financiador institucional — nunca se pisan estados de flujo
 * institucional (DOCUMENTADA/ENVIADA/OBSERVADA/RECHAZADA/CANCELADA).
 */
function financingStateFor(
  origenTipo: string,
  estadoActual: string,
  monto: Prisma.Decimal,
  cobrado: Prisma.Decimal,
): string {
  if (cobrado.gt(0) && cobrado.gte(monto)) return 'PAGADA';
  if (cobrado.gt(0)) return 'PARCIALMENTE_PAGADA';
  if (estadoActual === 'PARCIALMENTE_PAGADA' || estadoActual === 'PAGADA') {
    return origenTipo === 'CLIENTE' ? 'PENDIENTE' : 'APROBADA';
  }
  return estadoActual;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  // --- Destinos de pago ---

  findAllDestinos() {
    return this.prisma.destinoPago.findMany({
      where: { isActive: true },
      orderBy: { nombre: 'asc' },
    });
  }

  createDestino(dto: CreateDestinoPagoDto) {
    return this.prisma.destinoPago.create({
      data: {
        tipo: dto.tipo,
        nombre: dto.nombre,
        sedeAdministradoraId: dto.sedeAdministradoraId
          ? BigInt(dto.sedeAdministradoraId)
          : undefined,
        cajaId: dto.cajaId ? BigInt(dto.cajaId) : undefined,
        numeroReferencia: dto.numeroReferencia,
      },
    });
  }

  async updateDestino(id: bigint, dto: UpdateDestinoPagoDto) {
    await this.assertDestinoExists(id);
    return this.prisma.destinoPago.update({
      where: { id },
      data: {
        tipo: dto.tipo,
        nombre: dto.nombre,
        sedeAdministradoraId: dto.sedeAdministradoraId
          ? BigInt(dto.sedeAdministradoraId)
          : undefined,
        cajaId: dto.cajaId ? BigInt(dto.cajaId) : undefined,
        numeroReferencia: dto.numeroReferencia,
        isActive: dto.isActive,
      },
    });
  }

  // --- Pagos ---

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const sedeIds = await this.sedeScopeService.authorizedSedeIds(user);
    const where: Prisma.PaymentWhereInput = { sedeCobroId: { in: sedeIds }, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          metodoPago: { select: { id: true, codigo: true } },
          destinoPago: { select: { id: true, tipo: true, nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const payment = await this.prisma.payment.findFirst({ where: { id, deletedAt: null } });
    if (!payment)
      throw new NotFoundException({ code: 'PAGO_NO_ENCONTRADO', message: 'Pago no encontrado.' });
    this.sedeScopeService.assertSedeAccess(user, payment.sedeCobroId);
    return payment;
  }

  /** docs/22 §22.3: valida financiamiento/saldo (RB-022) y coherencia método↔destino (RB-027). */
  async create(user: AuthenticatedUser, dto: CreatePaymentDto) {
    const sedeCobroId = BigInt(dto.sedeCobroId);
    this.sedeScopeService.assertSedeAccess(user, sedeCobroId);

    const financing = await this.prisma.financing.findFirst({
      where: { id: BigInt(dto.financiamientoId), deletedAt: null },
    });
    if (!financing)
      throw new NotFoundException({
        code: 'FINANCIAMIENTO_NO_ENCONTRADO',
        message: 'Financiamiento no encontrado.',
      });
    if (financing.estado === 'CANCELADA') {
      throw new ConflictException({
        code: 'FINANCIAMIENTO_CANCELADO',
        message: 'El financiamiento está cancelado.',
      });
    }

    const metodo = await this.prisma.paymentMethod.findFirst({
      where: { id: BigInt(dto.metodoPagoId), isActive: true },
    });
    if (!metodo)
      throw new NotFoundException({
        code: 'METODO_PAGO_NO_ENCONTRADO',
        message: 'Método de pago no encontrado.',
      });

    const destino = await this.prisma.destinoPago.findFirst({
      where: { id: BigInt(dto.destinoPagoId), isActive: true },
    });
    if (!destino)
      throw new NotFoundException({
        code: 'DESTINO_PAGO_NO_ENCONTRADO',
        message: 'Destino de pago no encontrado.',
      });

    // RB-027: coherencia método <-> destino.
    if (metodo.esEfectivo && destino.tipo !== 'CAJA') {
      throw new BadRequestException({
        code: 'DESTINO_INCOHERENTE',
        message: 'Un pago en efectivo requiere un destino de tipo CAJA.',
      });
    }
    if (!metodo.esEfectivo && destino.tipo === 'CAJA') {
      throw new BadRequestException({
        code: 'DESTINO_INCOHERENTE',
        message: 'Un pago electrónico no puede usar un destino de tipo CAJA.',
      });
    }

    // RB-008/026, CA-PAY-04/CA-CASH-01: efectivo requiere una caja ABIERTA en
    // la sede de cobro; el pago queda vinculado a esa apertura.
    let apertura: { id: bigint } | null = null;
    if (metodo.esEfectivo) {
      if (!destino.cajaId) {
        throw new BadRequestException({
          code: 'DESTINO_INCOHERENTE',
          message: 'El destino CAJA no tiene una caja física asociada.',
        });
      }
      const caja = await this.prisma.cash.findFirst({
        where: { id: destino.cajaId, isActive: true },
      });
      if (!caja)
        throw new NotFoundException({ code: 'CAJA_NO_ENCONTRADA', message: 'Caja no encontrada.' });
      if (caja.sedeId !== sedeCobroId) {
        throw new BadRequestException({
          code: 'DESTINO_INCOHERENTE',
          message: 'La caja del destino no pertenece a la sede de cobro (RB-008).',
        });
      }
      apertura = await this.prisma.cashOpening.findFirst({
        where: { cajaId: caja.id, estado: 'ABIERTA' },
        select: { id: true },
      });
      if (!apertura) {
        throw new ConflictException({
          code: 'CAJA_NO_ABIERTA',
          message: 'No hay una caja abierta en la sede de cobro (RB-008/026).',
        });
      }
    }

    const monto = new Prisma.Decimal(dto.monto);
    const cobradoPrevio = await this.sumConfirmedPayments(financing.id);
    if (cobradoPrevio.add(monto).gt(financing.monto)) {
      throw new ConflictException({
        code: 'MONTO_EXCEDE_FINANCIAMIENTO',
        message: `El pago excede el saldo del financiamiento (pendiente: ${financing.monto.sub(cobradoPrevio).toString()}).`,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      if (apertura) {
        // Vuelve a bloquear/validar dentro de la transacción (RB-025-like):
        // la caja pudo haberse cerrado entre la validación previa y este punto.
        const rows = await tx.$queryRaw<{ estado: string }[]>`
          SELECT estado FROM aperturas_caja WHERE id = ${apertura.id} FOR UPDATE
        `;
        if (rows[0]?.estado !== 'ABIERTA') {
          throw new ConflictException({
            code: 'CAJA_NO_ABIERTA',
            message: 'La caja se cerró antes de confirmar el pago.',
          });
        }
      }

      const payment = await tx.payment.create({
        data: {
          financiamientoId: financing.id,
          ventaId: financing.ventaId,
          monto,
          metodoPagoId: metodo.id,
          destinoPagoId: destino.id,
          sedeCobroId,
          aperturaCajaId: apertura?.id,
          estado: 'CONFIRMADO',
          referencia: dto.referencia,
          usuarioId: user.id,
        },
      });

      if (apertura) {
        await tx.cashMovement.create({
          data: {
            aperturaCajaId: apertura.id,
            cajaId: destino.cajaId!,
            sedeId: sedeCobroId,
            tipo: 'VENTA_EFECTIVO',
            monto,
            pagoId: payment.id,
            concepto: `Pago en efectivo — financiamiento #${financing.id}`,
            usuarioId: user.id,
          },
        });
      }

      const nuevoCobrado = cobradoPrevio.add(monto);
      await tx.financing.update({
        where: { id: financing.id },
        data: {
          estado: financingStateFor(
            financing.origenTipo,
            financing.estado,
            financing.monto,
            nuevoCobrado,
          ),
        },
      });

      return payment;
    });
  }

  /** docs/22 §22.5 */
  async anular(user: AuthenticatedUser, id: bigint, dto: VoidPaymentDto) {
    const payment = await this.findOne(user, id);
    if (payment.estado !== 'CONFIRMADO') {
      throw new ConflictException({
        code: 'PAGO_NO_ANULABLE',
        message: 'Solo un pago CONFIRMADO puede anularse.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const voided = await tx.payment.update({
        where: { id },
        data: {
          estado: 'ANULADO',
          anuladoMotivo: dto.motivo,
          anuladoPor: user.id,
          anuladoAt: new Date(),
        },
      });

      // docs/22 §22.5: pago en efectivo anulado -> movimiento inverso en caja.
      // Si la apertura ya cerró, el movimiento queda como constancia para el
      // arqueo manual (no se puede reabrir ni recalcular un cierre pasado).
      if (payment.aperturaCajaId) {
        const apertura = await tx.cashOpening.findUniqueOrThrow({
          where: { id: payment.aperturaCajaId },
        });
        await tx.cashMovement.create({
          data: {
            aperturaCajaId: apertura.id,
            cajaId: apertura.cajaId,
            sedeId: apertura.sedeId,
            tipo: 'EGRESO',
            monto: payment.monto,
            pagoId: payment.id,
            concepto:
              apertura.estado === 'ABIERTA'
                ? `Reverso por anulación de pago #${payment.id}`
                : `Reverso por anulación de pago #${payment.id} (caja ya cerrada, constancia para arqueo)`,
            usuarioId: user.id,
          },
        });
      }

      const financing = await tx.financing.findUniqueOrThrow({
        where: { id: payment.financiamientoId },
      });
      const cobrado = await this.sumConfirmedPayments(financing.id, tx);
      await tx.financing.update({
        where: { id: financing.id },
        data: {
          estado: financingStateFor(
            financing.origenTipo,
            financing.estado,
            financing.monto,
            cobrado,
          ),
        },
      });

      return voided;
    });
  }

  private async sumConfirmedPayments(
    financiamientoId: bigint,
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.Decimal> {
    const client = tx ?? this.prisma;
    const result = await client.payment.aggregate({
      where: { financiamientoId, estado: 'CONFIRMADO' },
      _sum: { monto: true },
    });
    return result._sum.monto ?? new Prisma.Decimal(0);
  }

  private async assertDestinoExists(id: bigint): Promise<void> {
    const exists = await this.prisma.destinoPago.findUnique({ where: { id } });
    if (!exists)
      throw new NotFoundException({
        code: 'DESTINO_PAGO_NO_ENCONTRADO',
        message: 'Destino de pago no encontrado.',
      });
  }
}
