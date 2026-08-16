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
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      ...(query.q
        ? { OR: [{ nombre: { contains: query.q } }, { codigo: { contains: query.q } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const branch = await this.prisma.branch.findFirst({ where: { id, deletedAt: null } });
    if (!branch)
      throw new NotFoundException({ code: 'SEDE_NO_ENCONTRADA', message: 'Sede no encontrada.' });
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const exists = await this.prisma.branch.findFirst({
      where: { codigo: dto.codigo, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException({
        code: 'SEDE_CODIGO_DUPLICADO',
        message: 'Ya existe una sede con ese código.',
      });
    }
    return this.prisma.branch.create({ data: { ...dto, isMain: false } });
  }

  async update(id: bigint, dto: UpdateBranchDto) {
    await this.findOne(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  /** RF-022: no se permite borrado físico ni desactivar la sede principal. */
  async remove(id: bigint): Promise<void> {
    const branch = await this.findOne(id);
    if (branch.isMain) {
      throw new BadRequestException({
        code: 'SEDE_PRINCIPAL_NO_ELIMINABLE',
        message:
          'No se puede desactivar la sede principal. Asigne otra sede como principal primero.',
      });
    }
    await this.prisma.branch.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  /** RF-021/RB-024: exactamente una sede principal activa. Cambio transaccional. */
  async setPrincipal(id: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.branch.findFirst({ where: { id, deletedAt: null } });
      if (!target)
        throw new NotFoundException({ code: 'SEDE_NO_ENCONTRADA', message: 'Sede no encontrada.' });
      if (!target.isActive) {
        throw new BadRequestException({
          code: 'SEDE_INACTIVA',
          message: 'No se puede marcar como principal una sede inactiva.',
        });
      }
      if (target.isMain) return target;

      const current = await tx.branch.findFirst({ where: { isMain: true } });
      if (current) {
        await tx.branch.update({ where: { id: current.id }, data: { isMain: false } });
      }
      return tx.branch.update({ where: { id: target.id }, data: { isMain: true } });
    });
  }
}
