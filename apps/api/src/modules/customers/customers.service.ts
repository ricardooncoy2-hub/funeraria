import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UbigeoService } from '../ubigeo/ubigeo.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ubigeoService: UbigeoService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { nombres: { contains: query.q } },
              { apellidos: { contains: query.q } },
              { numeroDocumento: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { nombres: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer)
      throw new NotFoundException({
        code: 'CLIENTE_NO_ENCONTRADO',
        message: 'Cliente no encontrado.',
      });
    return customer;
  }

  /** RF-071: evita duplicados por (tipo_documento, numero_documento). */
  async create(dto: CreateCustomerDto) {
    const exists = await this.prisma.customer.findFirst({
      where: {
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        deletedAt: null,
      },
    });
    if (exists) {
      throw new ConflictException({
        code: 'CLIENTE_DOCUMENTO_DUPLICADO',
        message: 'Ya existe un cliente con ese tipo y número de documento.',
      });
    }
    if (dto.distritoId) await this.ubigeoService.assertDistritoExists(BigInt(dto.distritoId));
    const { distritoId, ...rest } = dto;
    return this.prisma.customer.create({
      data: { ...rest, distritoId: distritoId ? BigInt(distritoId) : undefined },
    });
  }

  async update(id: bigint, dto: UpdateCustomerDto) {
    await this.findOne(id);
    if (dto.distritoId) await this.ubigeoService.assertDistritoExists(BigInt(dto.distritoId));
    const { distritoId, ...rest } = dto;
    return this.prisma.customer.update({
      where: { id },
      data: { ...rest, distritoId: distritoId ? BigInt(distritoId) : undefined },
    });
  }

  async remove(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
