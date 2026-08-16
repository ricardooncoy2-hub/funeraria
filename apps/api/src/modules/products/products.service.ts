import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Categorías ---

  findAllCategories() {
    return this.prisma.productCategory.findMany({ orderBy: { nombre: 'asc' } });
  }

  async createCategory(dto: CreateProductCategoryDto) {
    const exists = await this.prisma.productCategory.findUnique({ where: { nombre: dto.nombre } });
    if (exists) {
      throw new ConflictException({
        code: 'CATEGORIA_DUPLICADA',
        message: 'Ya existe una categoría con ese nombre.',
      });
    }
    return this.prisma.productCategory.create({ data: dto });
  }

  async updateCategory(id: bigint, dto: UpdateProductCategoryDto) {
    await this.assertCategoryExists(id);
    return this.prisma.productCategory.update({ where: { id }, data: dto });
  }

  // --- Productos ---

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.q
        ? { OR: [{ nombre: { contains: query.q } }, { codigo: { contains: query.q } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { categoria: { select: { id: true, nombre: true } } },
        orderBy: { nombre: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { categoria: { select: { id: true, nombre: true } } },
    });
    if (!product)
      throw new NotFoundException({
        code: 'PRODUCTO_NO_ENCONTRADO',
        message: 'Producto no encontrado.',
      });
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryExists(BigInt(dto.categoriaProductoId));
    const exists = await this.prisma.product.findFirst({
      where: { codigo: dto.codigo, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException({
        code: 'PRODUCTO_CODIGO_DUPLICADO',
        message: 'Ya existe un producto con ese código.',
      });
    }
    return this.prisma.product.create({
      data: { ...dto, categoriaProductoId: BigInt(dto.categoriaProductoId) },
    });
  }

  async update(id: bigint, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.categoriaProductoId) await this.assertCategoryExists(BigInt(dto.categoriaProductoId));
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        categoriaProductoId: dto.categoriaProductoId ? BigInt(dto.categoriaProductoId) : undefined,
      },
    });
  }

  async remove(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  private async assertCategoryExists(id: bigint): Promise<void> {
    const exists = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!exists)
      throw new NotFoundException({
        code: 'CATEGORIA_NO_ENCONTRADA',
        message: 'Categoría de producto no encontrada.',
      });
  }
}
