import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { AccountsReceivableQueryDto } from './dto/accounts-receivable-query.dto';
import { CreateFinanciadorDto } from './dto/create-financiador.dto';
import { FinancingQueryDto } from './dto/financing-query.dto';
import { SetFinancingStatusDto } from './dto/set-financing-status.dto';
import { UpdateFinanciadorDto } from './dto/update-financiador.dto';
import { UpdateFinancingDto } from './dto/update-financing.dto';
import { FinancingService } from './financing.service';

@ApiTags('financiadores')
@Permissions('financiamiento.gestionar')
@Controller()
export class FinancingController {
  constructor(private readonly financingService: FinancingService) {}

  @Get('financiadores')
  @ApiOperation({ summary: 'Lista financiadores (RF-036)' })
  findAllFinanciadores(@Query() query: PaginationQueryDto) {
    return this.financingService.findAllFinanciadores(query);
  }

  @Get('financiadores/:id')
  @ApiOperation({ summary: 'Detalle de un financiador' })
  findOneFinanciador(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.financingService.findOneFinanciador(id);
  }

  @Post('financiadores')
  @ApiOperation({ summary: 'Crea un financiador (SIS/EsSalud/aseguradora/institución, RB-012)' })
  createFinanciador(@Body() dto: CreateFinanciadorDto) {
    return this.financingService.createFinanciador(dto);
  }

  @Patch('financiadores/:id')
  @ApiOperation({ summary: 'Edita un financiador' })
  updateFinanciador(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateFinanciadorDto) {
    return this.financingService.updateFinanciador(id, dto);
  }

  @Delete('financiadores/:id')
  @ApiOperation({ summary: 'Desactiva un financiador (soft delete)' })
  removeFinanciador(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.financingService.removeFinanciador(id);
  }

  @Get('financiamientos')
  @ApiOperation({ summary: 'Lista financiamientos de las sedes autorizadas' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: FinancingQueryDto) {
    return this.financingService.findAll(user, query);
  }

  @Get('financiamientos/:id')
  @ApiOperation({ summary: 'Detalle de un financiamiento' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.financingService.findOne(user, id);
  }

  @Patch('financiamientos/:id')
  @ApiOperation({ summary: 'Edita datos de cobertura de un financiamiento (RB-014)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateFinancingDto,
  ) {
    return this.financingService.update(user, id, dto);
  }

  @Patch('financiamientos/:id/estado')
  @ApiOperation({ summary: 'Cambia el estado del financiamiento (docs/21 §21.4)' })
  setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SetFinancingStatusDto,
  ) {
    return this.financingService.setStatus(user, id, dto);
  }

  @Get('cuentas-por-cobrar')
  @ApiOperation({ summary: 'CxC por financiador con antigüedad (docs/21 §21.5, CA-REP-03)' })
  cuentasPorCobrar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AccountsReceivableQueryDto,
  ) {
    return this.financingService.cuentasPorCobrar(user, query);
  }
}
