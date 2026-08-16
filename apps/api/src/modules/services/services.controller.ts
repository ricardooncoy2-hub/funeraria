import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateServiceDto } from './dto/create-service.dto';
import { SetServiceBranchesDto } from './dto/set-service-branches.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('servicios')
@Controller('servicios')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Permissions('catalogo.leer')
  @Get()
  @ApiOperation({ summary: 'Lista servicios (RF-031)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Permissions('catalogo.leer')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un servicio con disponibilidad por sede' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.servicesService.findOne(id);
  }

  @Permissions('catalogo.gestionar')
  @Post()
  @ApiOperation({ summary: 'Crea un servicio' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Permissions('catalogo.gestionar')
  @Patch(':id')
  @ApiOperation({ summary: 'Edita un servicio' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Permissions('catalogo.gestionar')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva un servicio (soft delete)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.servicesService.remove(id);
  }

  @Permissions('catalogo.gestionar')
  @Patch(':id/sedes')
  @ApiOperation({ summary: 'Fija disponibilidad/precio del servicio por sede (RF-032, RB-029)' })
  setBranches(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: SetServiceBranchesDto) {
    return this.servicesService.setBranches(id, dto);
  }
}
