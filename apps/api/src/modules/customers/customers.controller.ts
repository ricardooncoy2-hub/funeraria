import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('clientes')
@Controller('clientes')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista clientes (paginado, corporativo)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un cliente' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.customersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un cliente (RF-070/071)' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita un cliente' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva un cliente (soft delete)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.customersService.remove(id);
  }
}
