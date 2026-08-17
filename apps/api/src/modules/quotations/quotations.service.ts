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
import { CreateSaleDto } from '../sales/dto/create-sale.dto';
import { SalesService } from '../sales/sales.service';
import { AssignQuotationDto } from './dto/assign-quotation.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QUOTATION_STATES, SetQuotationStatusDto } from './dto/set-quotation-status.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

type QuotationState = (typeof QUOTATION_STATES)[number];

/** docs/23 §23.3 */
const ALLOWED_TRANSITIONS: Record<QuotationState, QuotationState[]> = {
  SOLICITADA: ['EN_REVISION', 'VENCIDA', 'CANCELADA'],
  EN_REVISION: ['ASIGNADA', 'CANCELADA'],
  ASIGNADA: ['CONTACTADA', 'VENCIDA', 'CANCELADA'],
  CONTACTADA: ['EN_NEGOCIACION', 'CANCELADA'],
  EN_NEGOCIACION: ['ACEPTADA', 'RECHAZADA', 'CANCELADA'],
  ACEPTADA: [],
  RECHAZADA: [],
  VENCIDA: [],
  CANCELADA: [],
};

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sedeScopeService: SedeScopeService,
    private readonly salesService: SalesService,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const sedeIds = await this.sedeScopeService.authorizedSedeIds(user);
    const where: Prisma.QuotationWhereInput = {
      deletedAt: null,
      OR: [{ sedeAsignadaId: { in: sedeIds } }, { sedeAsignadaId: null }],
    };

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: {
          sedeAsignada: { select: { id: true, nombre: true } },
          sedePreferida: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  /** Sin sede asignada aún: visible para cualquier usuario con permiso de
   * gestión (triage, RF-084). Con sede asignada, se restringe a las sedes
   * autorizadas del usuario, igual que findAll. */
  async findOne(user: AuthenticatedUser, id: bigint) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: true,
        items: { include: { producto: true, servicio: true } },
        plan: true,
        sedePreferida: { select: { id: true, nombre: true } },
        sedeAsignada: { select: { id: true, nombre: true } },
      },
    });
    if (!quotation)
      throw new NotFoundException({
        code: 'COTIZACION_NO_ENCONTRADA',
        message: 'Cotización no encontrada.',
      });
    if (quotation.sedeAsignadaId) {
      this.sedeScopeService.assertSedeAccess(user, quotation.sedeAsignadaId);
    }
    return quotation;
  }

  async create(dto: CreateQuotationDto) {
    if (dto.clienteId) {
      const cliente = await this.prisma.customer.findFirst({
        where: { id: BigInt(dto.clienteId), deletedAt: null },
      });
      if (!cliente)
        throw new NotFoundException({
          code: 'CLIENTE_NO_ENCONTRADO',
          message: 'Cliente no encontrado.',
        });
    }

    return this.prisma.$transaction(async (tx) => {
      const codigo = await this.generateCode(tx);
      return tx.quotation.create({
        data: {
          codigo,
          origen: dto.origen,
          solicitanteNombres: dto.solicitanteNombres,
          solicitanteTelefono: dto.solicitanteTelefono,
          solicitanteCorreo: dto.solicitanteCorreo,
          clienteId: dto.clienteId ? BigInt(dto.clienteId) : undefined,
          sedePreferidaId: dto.sedePreferidaId ? BigInt(dto.sedePreferidaId) : undefined,
          planId: dto.planId ? BigInt(dto.planId) : undefined,
          observaciones: dto.observaciones,
          validoHasta: dto.validoHasta ? new Date(dto.validoHasta) : undefined,
          consentimientoDatos: dto.consentimientoDatos,
          estado: 'SOLICITADA',
          items: dto.items
            ? {
                create: dto.items.map((item) => ({
                  itemTipo: item.itemTipo,
                  productoId: item.productoId ? BigInt(item.productoId) : undefined,
                  servicioId: item.servicioId ? BigInt(item.servicioId) : undefined,
                  cantidad: item.cantidad,
                  precioReferencial: item.precioReferencial,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });
    });
  }

  async update(user: AuthenticatedUser, id: bigint, dto: UpdateQuotationDto) {
    await this.findOne(user, id);
    return this.prisma.quotation.update({
      where: { id },
      data: {
        origen: dto.origen,
        solicitanteNombres: dto.solicitanteNombres,
        solicitanteTelefono: dto.solicitanteTelefono,
        solicitanteCorreo: dto.solicitanteCorreo,
        observaciones: dto.observaciones,
        validoHasta: dto.validoHasta ? new Date(dto.validoHasta) : undefined,
      },
    });
  }

  /** RF-084: EN_REVISION -> ASIGNADA */
  async asignar(user: AuthenticatedUser, id: bigint, dto: AssignQuotationDto) {
    const quotation = await this.findOne(user, id);
    this.assertTransition(quotation.estado as QuotationState, 'ASIGNADA');

    const sede = await this.prisma.branch.findFirst({
      where: { id: BigInt(dto.sedeAsignadaId), deletedAt: null },
    });
    if (!sede)
      throw new NotFoundException({ code: 'SEDE_NO_ENCONTRADA', message: 'Sede no encontrada.' });

    return this.prisma.quotation.update({
      where: { id },
      data: {
        sedeAsignadaId: sede.id,
        usuarioAsignadoId: dto.usuarioAsignadoId ? BigInt(dto.usuarioAsignadoId) : undefined,
        estado: 'ASIGNADA',
      },
    });
  }

  async setStatus(user: AuthenticatedUser, id: bigint, dto: SetQuotationStatusDto) {
    const quotation = await this.findOne(user, id);
    this.assertTransition(quotation.estado as QuotationState, dto.estado);
    return this.prisma.quotation.update({ where: { id }, data: { estado: dto.estado } });
  }

  /** docs/23 §23.6 (RF-085/CA-QUO-02): hereda cliente e ítems; la venta guarda cotizacion_id. */
  async convertirVenta(user: AuthenticatedUser, id: bigint) {
    const quotation = await this.findOne(user, id);
    if (quotation.estado !== 'ACEPTADA') {
      throw new ConflictException({
        code: 'COTIZACION_NO_CONVERTIBLE',
        message: 'Solo una cotización ACEPTADA puede convertirse en venta.',
      });
    }
    if (!quotation.clienteId) {
      throw new BadRequestException({
        code: 'COTIZACION_SIN_CLIENTE',
        message: 'La cotización debe tener un cliente vinculado para convertirse en venta.',
      });
    }
    const sedeVentaId = quotation.sedeAsignadaId ?? quotation.sedePreferidaId;
    if (!sedeVentaId) {
      throw new BadRequestException({
        code: 'COTIZACION_SIN_SEDE',
        message:
          'La cotización debe tener una sede asignada o preferida para convertirse en venta.',
      });
    }

    const items =
      quotation.items.length > 0
        ? quotation.items.map((item) => ({
            itemTipo: item.itemTipo as 'PRODUCTO' | 'SERVICIO',
            productoId: item.productoId?.toString(),
            servicioId: item.servicioId?.toString(),
            cantidad: Number(item.cantidad),
          }))
        : quotation.planId
          ? [{ itemTipo: 'PLAN' as const, planId: quotation.planId.toString(), cantidad: 1 }]
          : null;

    if (!items) {
      throw new BadRequestException({
        code: 'COTIZACION_SIN_ITEMS',
        message: 'La cotización no tiene ítems ni plan para convertir.',
      });
    }

    const saleDto: CreateSaleDto = {
      sedeVentaId: sedeVentaId.toString(),
      clienteId: quotation.clienteId.toString(),
      items,
    };

    return this.salesService.create(user, saleDto, quotation.id);
  }

  private assertTransition(actual: QuotationState, target: QuotationState): void {
    if (!ALLOWED_TRANSITIONS[actual]?.includes(target)) {
      throw new ConflictException({
        code: 'TRANSICION_INVALIDA',
        message: `No se puede pasar de ${actual} a ${target}.`,
      });
    }
  }

  private async generateCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `COT-${year}-`;
    const count = await tx.quotation.count({ where: { codigo: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
}
