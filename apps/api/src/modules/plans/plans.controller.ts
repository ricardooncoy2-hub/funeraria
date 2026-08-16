import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './plans.service';

@ApiTags('planes')
@Controller('planes')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Permissions('catalogo.leer')
  @Get()
  @ApiOperation({ summary: 'Lista planes/paquetes (RF-033)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.plansService.findAll(query);
  }

  @Permissions('catalogo.leer')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un plan con sus componentes (RF-034)' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.plansService.findOne(id);
  }

  @Permissions('catalogo.gestionar')
  @Post()
  @ApiOperation({ summary: 'Crea un plan con sus componentes' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Permissions('catalogo.gestionar')
  @Patch(':id')
  @ApiOperation({ summary: 'Edita un plan (reemplaza componentes si se envían)' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Permissions('catalogo.gestionar')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva un plan (soft delete)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.plansService.remove(id);
  }
}
