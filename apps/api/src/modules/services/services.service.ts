import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { SetServiceBranchesDto } from './dto/set-service-branches.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      ...(query.q
        ? { OR: [{ nombre: { contains: query.q } }, { codigo: { contains: query.q } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        branchServices: {
          include: { branch: { select: { id: true, codigo: true, nombre: true } } },
        },
      },
    });
    if (!service)
      throw new NotFoundException({
        code: 'SERVICIO_NO_ENCONTRADO',
        message: 'Servicio no encontrado.',
      });
    return service;
  }

  async create(dto: CreateServiceDto) {
    const exists = await this.prisma.service.findFirst({
      where: { codigo: dto.codigo, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException({
        code: 'SERVICIO_CODIGO_DUPLICADO',
        message: 'Ya existe un servicio con ese código.',
      });
    }
    return this.prisma.service.create({ data: dto });
  }

  async update(id: bigint, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async remove(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.service.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  /** RF-031/032: disponibilidad y precio override por sede (upsert por entrada, RB-029). */
  async setBranches(id: bigint, dto: SetServiceBranchesDto) {
    await this.findOne(id);

    const sedeIds = dto.sedes.map((s) => BigInt(s.sedeId));
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: sedeIds }, deletedAt: null },
    });
    if (branches.length !== sedeIds.length) {
      throw new NotFoundException({
        code: 'SEDE_NO_ENCONTRADA',
        message: 'Una o más sedes no existen.',
      });
    }

    await this.prisma.$transaction(
      dto.sedes.map((s) =>
        this.prisma.branchService.upsert({
          where: { sedeId_servicioId: { sedeId: BigInt(s.sedeId), servicioId: id } },
          update: { disponible: s.disponible, precio: s.precio ?? null },
          create: {
            sedeId: BigInt(s.sedeId),
            servicioId: id,
            disponible: s.disponible,
            precio: s.precio ?? null,
          },
        }),
      ),
    );

    return this.findOne(id);
  }
}
