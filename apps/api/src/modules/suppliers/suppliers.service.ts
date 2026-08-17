import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UbigeoService } from '../ubigeo/ubigeo.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ubigeoService: UbigeoService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { razonSocial: { contains: query.q } },
              { nombreComercial: { contains: query.q } },
              { numeroDocumento: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { razonSocial: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!supplier)
      throw new NotFoundException({
        code: 'PROVEEDOR_NO_ENCONTRADO',
        message: 'Proveedor no encontrado.',
      });
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const exists = await this.prisma.supplier.findFirst({
      where: {
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        deletedAt: null,
      },
    });
    if (exists) {
      throw new ConflictException({
        code: 'PROVEEDOR_DOCUMENTO_DUPLICADO',
        message: 'Ya existe un proveedor con ese tipo y número de documento.',
      });
    }
    if (dto.distritoId) await this.ubigeoService.assertDistritoExists(BigInt(dto.distritoId));
    const { distritoId, ...rest } = dto;
    return this.prisma.supplier.create({
      data: { ...rest, distritoId: distritoId ? BigInt(distritoId) : undefined },
    });
  }

  async update(id: bigint, dto: UpdateSupplierDto) {
    await this.findOne(id);
    if (dto.distritoId) await this.ubigeoService.assertDistritoExists(BigInt(dto.distritoId));
    const { distritoId, ...rest } = dto;
    return this.prisma.supplier.update({
      where: { id },
      data: { ...rest, distritoId: distritoId ? BigInt(distritoId) : undefined },
    });
  }

  async remove(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
