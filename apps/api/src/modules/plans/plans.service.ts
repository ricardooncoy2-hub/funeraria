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
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlanItemDto } from './dto/plan-item.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.PlanWhereInput = {
      deletedAt: null,
      ...(query.q
        ? { OR: [{ nombre: { contains: query.q } }, { codigo: { contains: query.q } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
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

  async create(dto: CreatePlanDto) {
    const exists = await this.prisma.plan.findFirst({
      where: { codigo: dto.codigo, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException({
        code: 'PLAN_CODIGO_DUPLICADO',
        message: 'Ya existe un plan con ese código.',
      });
    }
    await this.assertItemsValid(dto.items);

    return this.prisma.plan.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: dto.precio,
        afectoIgv: dto.afectoIgv,
        items: { create: dto.items.map((item) => this.toItemData(item)) },
      },
      include: { items: true },
    });
  }

  async update(id: bigint, dto: UpdatePlanDto) {
    await this.findOne(id);
    if (dto.items) await this.assertItemsValid(dto.items);

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.planItem.deleteMany({ where: { planId: id } });
        await tx.planItem.createMany({
          data: dto.items.map((item) => ({ planId: id, ...this.toItemData(item) })),
        });
      }
      return tx.plan.update({
        where: { id },
        data: {
          codigo: dto.codigo,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          precio: dto.precio,
          afectoIgv: dto.afectoIgv,
          isActive: dto.isActive,
        },
        include: { items: true },
      });
    });
  }

  async remove(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.plan.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  /** Coherencia item_tipo <-> producto/servicio (el CHECK equivalente no se pudo crear vía migración, ver docs/10 §10.4). */
  private async assertItemsValid(items: PlanItemDto[]): Promise<void> {
    const productoIds = items
      .filter((i) => i.itemTipo === 'PRODUCTO')
      .map((i) => BigInt(i.productoId!));
    const servicioIds = items
      .filter((i) => i.itemTipo === 'SERVICIO')
      .map((i) => BigInt(i.servicioId!));

    if (productoIds.length > 0) {
      const found = await this.prisma.product.count({
        where: { id: { in: productoIds }, deletedAt: null },
      });
      if (found !== new Set(productoIds.map(String)).size) {
        throw new BadRequestException({
          code: 'PRODUCTO_NO_ENCONTRADO',
          message: 'Uno o más productos del plan no existen.',
        });
      }
    }
    if (servicioIds.length > 0) {
      const found = await this.prisma.service.count({
        where: { id: { in: servicioIds }, deletedAt: null },
      });
      if (found !== new Set(servicioIds.map(String)).size) {
        throw new BadRequestException({
          code: 'SERVICIO_NO_ENCONTRADO',
          message: 'Uno o más servicios del plan no existen.',
        });
      }
    }
  }

  private toItemData(item: PlanItemDto) {
    return {
      itemTipo: item.itemTipo,
      productoId: item.itemTipo === 'PRODUCTO' ? BigInt(item.productoId!) : null,
      servicioId: item.itemTipo === 'SERVICIO' ? BigInt(item.servicioId!) : null,
      cantidad: item.cantidad,
    };
  }
}
