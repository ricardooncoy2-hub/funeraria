import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { SedeScopeService } from '../authz/sede-scope.service';
import { AccountsReceivableQueryDto } from './dto/accounts-receivable-query.dto';
import { CreateFinanciadorDto } from './dto/create-financiador.dto';
import { FinancingQueryDto } from './dto/financing-query.dto';
import { FINANCING_STATES, SetFinancingStatusDto } from './dto/set-financing-status.dto';
import { UpdateFinanciadorDto } from './dto/update-financiador.dto';
import { UpdateFinancingDto } from './dto/update-financing.dto';

type FinancingState = (typeof FINANCING_STATES)[number];

/** docs/21 §21.4. PARCIALMENTE_PAGADA/PAGADA son automáticas (ver PaymentsService), no transiciones manuales. */
const FINANCIADOR_TRANSITIONS: Partial<Record<FinancingState, FinancingState[]>> = {
  PENDIENTE: ['DOCUMENTADA', 'CANCELADA'],
  DOCUMENTADA: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['OBSERVADA', 'APROBADA', 'RECHAZADA', 'CANCELADA'],
  OBSERVADA: ['ENVIADA', 'CANCELADA'],
  APROBADA: ['CANCELADA'],
};

/** docs/21 §21.4: ciclo simplificado del cliente — no requiere documentación institucional. */
const CLIENTE_TRANSITIONS: Partial<Record<FinancingState, FinancingState[]>> = {
  PENDIENTE: ['CANCELADA'],
};

@Injectable()
export class FinancingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  // --- Financiadores ---

  async findAllFinanciadores(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.FinanciadorWhereInput = {
      deletedAt: null,
      ...(query.q ? { nombre: { contains: query.q } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.financiador.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.financiador.count({ where }),
    ]);
    return paginate(data, total, query.page, query.pageSize);
  }

  async findOneFinanciador(id: bigint) {
    const financiador = await this.prisma.financiador.findFirst({ where: { id, deletedAt: null } });
    if (!financiador)
      throw new NotFoundException({
        code: 'FINANCIADOR_NO_ENCONTRADO',
        message: 'Financiador no encontrado.',
      });
    return financiador;
  }

  createFinanciador(dto: CreateFinanciadorDto) {
    return this.prisma.financiador.create({ data: dto });
  }

  async updateFinanciador(id: bigint, dto: UpdateFinanciadorDto) {
    await this.findOneFinanciador(id);
    return this.prisma.financiador.update({ where: { id }, data: dto });
  }

  async removeFinanciador(id: bigint): Promise<void> {
    await this.findOneFinanciador(id);
    await this.prisma.financiador.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // --- Financiamientos ---

  async findAll(
    user: AuthenticatedUser,
    query: FinancingQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const sedeIds = await this.sedeScopeService.authorizedSedeIds(user);
    const where: Prisma.FinancingWhereInput = {
      deletedAt: null,
      venta: { sedeVentaId: { in: sedeIds } },
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.financiadorId ? { financiadorId: BigInt(query.financiadorId) } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.financing.findMany({
        where,
        include: {
          financiador: { select: { id: true, nombre: true, tipo: true } },
          venta: { select: { id: true, codigo: true, sedeVentaId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.financing.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: bigint) {
    const financing = await this.prisma.financing.findFirst({
      where: { id, deletedAt: null },
      include: {
        financiador: true,
        cliente: true,
        venta: { select: { id: true, codigo: true, sedeVentaId: true, total: true } },
        payments: true,
      },
    });
    if (!financing)
      throw new NotFoundException({
        code: 'FINANCIAMIENTO_NO_ENCONTRADO',
        message: 'Financiamiento no encontrado.',
      });
    this.sedeScopeService.assertSedeAccess(user, financing.venta.sedeVentaId);
    return financing;
  }

  async update(user: AuthenticatedUser, id: bigint, dto: UpdateFinancingDto) {
    await this.findOne(user, id);
    return this.prisma.financing.update({
      where: { id },
      data: {
        numeroPoliza: dto.numeroPoliza,
        documentoCoberturaUrl: dto.documentoCoberturaUrl,
        montoAutorizado: dto.montoAutorizado,
        observaciones: dto.observaciones,
      },
    });
  }

  /** docs/21 §21.4: máquina de estados; distinta para CLIENTE vs FINANCIADOR. */
  async setStatus(user: AuthenticatedUser, id: bigint, dto: SetFinancingStatusDto) {
    const financing = await this.findOne(user, id);
    const allowed =
      financing.origenTipo === 'CLIENTE' ? CLIENTE_TRANSITIONS : FINANCIADOR_TRANSITIONS;

    const targets = allowed[financing.estado as FinancingState];
    if (!targets?.includes(dto.estado)) {
      throw new ConflictException({
        code: 'TRANSICION_INVALIDA',
        message: `No se puede pasar de ${financing.estado} a ${dto.estado}.`,
      });
    }

    const data: Prisma.FinancingUpdateInput = { estado: dto.estado };
    if (dto.estado === 'ENVIADA' && !financing.fechaSolicitud) data.fechaSolicitud = new Date();
    if (dto.estado === 'APROBADA') data.fechaAprobacion = new Date();

    return this.prisma.financing.update({ where: { id }, data });
  }

  /** docs/21 §21.5 */
  async cuentasPorCobrar(user: AuthenticatedUser, query: AccountsReceivableQueryDto) {
    const sedeIds = query.sedeId
      ? [BigInt(query.sedeId)]
      : await this.sedeScopeService.authorizedSedeIds(user);
    if (query.sedeId) this.sedeScopeService.assertSedeAccess(user, BigInt(query.sedeId));

    const financings = await this.prisma.financing.findMany({
      where: {
        deletedAt: null,
        origenTipo: 'FINANCIADOR',
        estado: { in: ['APROBADA', 'PARCIALMENTE_PAGADA'] },
        venta: { sedeVentaId: { in: sedeIds } },
        ...(query.financiadorId ? { financiadorId: BigInt(query.financiadorId) } : {}),
      },
      include: {
        financiador: { select: { id: true, nombre: true, diasCredito: true } },
        venta: { select: { id: true, codigo: true, sedeVentaId: true, fecha: true } },
        payments: { where: { estado: 'CONFIRMADO' }, select: { monto: true } },
      },
    });

    const hoy = new Date();
    const result = financings
      .map((f) => {
        const cobrado = f.payments.reduce((acc, p) => acc.add(p.monto), new Prisma.Decimal(0));
        const pendiente = f.monto.sub(cobrado);
        const desde = f.fechaAprobacion ?? f.venta.fecha;
        const dias = Math.floor((hoy.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
        const diasCredito = f.financiador?.diasCredito ?? null;
        return {
          financiamientoId: f.id,
          financiador: f.financiador
            ? { id: f.financiador.id, nombre: f.financiador.nombre }
            : null,
          venta: { id: f.venta.id, codigo: f.venta.codigo },
          monto: f.monto,
          cobrado,
          pendiente,
          dias,
          vencido: diasCredito !== null && dias > diasCredito,
          estado: f.estado,
        };
      })
      .filter((row) => row.pendiente.gt(0))
      .filter((row) => (query.antiguedadMinima ? row.dias >= query.antiguedadMinima : true));

    return result;
  }
}
