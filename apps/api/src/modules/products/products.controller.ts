import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('productos')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Permissions('catalogo.leer')
  @Get('categorias-producto')
  @ApiOperation({ summary: 'Lista categorías de producto' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Permissions('catalogo.gestionar')
  @Post('categorias-producto')
  @ApiOperation({ summary: 'Crea una categoría de producto' })
  createCategory(@Body() dto: CreateProductCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Permissions('catalogo.gestionar')
  @Patch('categorias-producto/:id')
  @ApiOperation({ summary: 'Edita una categoría de producto' })
  updateCategory(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateProductCategoryDto) {
    return this.productsService.updateCategory(id, dto);
  }

  @Permissions('catalogo.leer')
  @Get('productos')
  @ApiOperation({ summary: 'Lista productos (catálogo maestro, RF-030)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  @Permissions('catalogo.leer')
  @Get('productos/:id')
  @ApiOperation({ summary: 'Detalle de un producto' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.productsService.findOne(id);
  }

  @Permissions('catalogo.gestionar')
  @Post('productos')
  @ApiOperation({ summary: 'Crea un producto' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Permissions('catalogo.gestionar')
  @Patch('productos/:id')
  @ApiOperation({ summary: 'Edita un producto' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Permissions('catalogo.gestionar')
  @Delete('productos/:id')
  @ApiOperation({ summary: 'Desactiva un producto (soft delete)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.productsService.remove(id);
  }
}
