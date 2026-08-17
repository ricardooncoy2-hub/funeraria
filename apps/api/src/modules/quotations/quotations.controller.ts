import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { AssignQuotationDto } from './dto/assign-quotation.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { SetQuotationStatusDto } from './dto/set-quotation-status.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('cotizaciones')
@Permissions('cotizaciones.gestionar')
@Controller('cotizaciones')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista cotizaciones visibles para el usuario' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.quotationsService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una cotización' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.quotationsService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una cotización interna (RF-081)' })
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita datos de la cotización' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(user, id, dto);
  }

  @Post(':id/asignar')
  @ApiOperation({ summary: 'Asigna la cotización a una sede (RF-084)' })
  asignar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: AssignQuotationDto,
  ) {
    return this.quotationsService.asignar(user, id, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambia el estado de la cotización (docs/23 §23.3)' })
  setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SetQuotationStatusDto,
  ) {
    return this.quotationsService.setStatus(user, id, dto);
  }

  @Permissions('ventas.crear')
  @Post(':id/convertir-venta')
  @ApiOperation({ summary: 'Convierte una cotización ACEPTADA en venta (RF-085, CA-QUO-02)' })
  convertirVenta(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.quotationsService.convertirVenta(user, id);
  }
}
