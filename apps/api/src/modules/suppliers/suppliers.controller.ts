import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('proveedores')
@Controller('proveedores')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista proveedores (RF-035)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un proveedor' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.suppliersService.findOne(id);
  }

  @Permissions('compras.gestionar')
  @Post()
  @ApiOperation({ summary: 'Crea un proveedor' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Permissions('compras.gestionar')
  @Patch(':id')
  @ApiOperation({ summary: 'Edita un proveedor' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Permissions('compras.gestionar')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva un proveedor (soft delete)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.suppliersService.remove(id);
  }
}
