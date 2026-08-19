import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationCreateInput, QuotationsService } from '../quotations/quotations.service';
import { PublicCreateQuotationDto } from './dto/public-create-quotation.dto';

/** Cadena completa de ubicación, igual que `BranchesService` (docs/10 §10.2.1). */
const DISTRITO_INCLUDE = {
  distrito: { include: { provincia: { include: { departamento: true } } } },
} satisfies Prisma.BranchInclude;

/**
 * Lectura de catálogo/sedes sin autenticación y creación de cotizaciones
 * `origen:'WEB'` para el sitio público (docs/15 §15.1, docs/23 §23.2/23.8-9).
 * Reutiliza el mismo `select`/`include` que ya usan `ProductsService`/
 * `ServicesService`/`PlansService`/`BranchesService` para no reinventar la
 * forma de los datos, agregando `isActive: true` explícito (ninguno de esos
 * servicios lo filtra hoy — solo `deletedAt`) para no exponer catálogo
 * desactivado por el admin. Sin paginación: el catálogo real es chico
 * (~13 productos, 11 servicios, 4 planes, 1 sede).
 */
@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  findAllServicios() {
    return this.prisma.service.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneServicio(codigo: string) {
    const servicio = await this.prisma.service.findFirst({
      where: { codigo, deletedAt: null, isActive: true },
    });
    if (!servicio)
      throw new NotFoundException({
        code: 'SERVICIO_NO_ENCONTRADO',
        message: 'Servicio no encontrado.',
      });
    return servicio;
  }

  findAllProductos() {
    return this.prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  findAllPlanes() {
    return this.prisma.plan.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOnePlan(codigo: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { codigo, deletedAt: null, isActive: true },
      include: {
        items: {
          include: {
            producto: { select: { id: true, nombre: true } },
            servicio: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    if (!plan)
      throw new NotFoundException({ code: 'PLAN_NO_ENCONTRADO', message: 'Plan no encontrado.' });
    return plan;
  }

  findAllSedes() {
    return this.prisma.branch.findMany({
      where: { deletedAt: null, isActive: true },
      include: DISTRITO_INCLUDE,
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * CA-QUO-01/CA-DP-01: fuerza `origen:'WEB'` en servidor (nunca del cliente)
   * y exige consentimiento explícito antes de tocar la BD — hoy
   * `QuotationsService.create()` no lo obliga porque el camino interno lo
   * llenan usuarios del equipo, no visitantes anónimos.
   */
  async crearCotizacionPublica(dto: PublicCreateQuotationDto) {
    if (!dto.consentimientoDatos) {
      throw new BadRequestException({
        code: 'CONSENTIMIENTO_REQUERIDO',
        message: 'Debe aceptar el consentimiento de datos personales para enviar la solicitud.',
      });
    }

    const input: QuotationCreateInput = { ...dto, origen: 'WEB' };
    return this.quotationsService.create(input);
  }
}
