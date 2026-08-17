import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CashService } from './cash.service';
import { CashQueryDto } from './dto/cash-query.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { CreateCashDto } from './dto/create-cash.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { OpenCashDto } from './dto/open-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

@ApiTags('caja')
@Controller()
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Permissions('caja.operar')
  @Get('cajas')
  @ApiOperation({ summary: 'Lista cajas de las sedes autorizadas' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CashQueryDto) {
    return this.cashService.findAll(user, query);
  }

  @Permissions('caja.operar')
  @Get('cajas/:id')
  @ApiOperation({ summary: 'Detalle de una caja' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.cashService.findOne(user, id);
  }

  @Permissions('config.gestionar')
  @Post('cajas')
  @ApiOperation({ summary: 'Crea una caja por sede (ADR-011)' })
  createCaja(@Body() dto: CreateCashDto) {
    return this.cashService.createCaja(dto);
  }

  @Permissions('config.gestionar')
  @Patch('cajas/:id')
  @ApiOperation({ summary: 'Edita una caja' })
  updateCaja(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateCashDto) {
    return this.cashService.updateCaja(id, dto);
  }

  @Permissions('caja.operar')
  @Post('cajas/:id/aperturas')
  @ApiOperation({ summary: 'Abre una sesión de caja (RB-026, CA-CASH-01)' })
  abrir(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: OpenCashDto,
  ) {
    return this.cashService.abrir(user, id, dto);
  }

  @Permissions('caja.operar')
  @Get('aperturas-caja/:id/resumen')
  @ApiOperation({ summary: 'Resumen de movimientos y saldo teórico de una apertura' })
  resumen(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.cashService.resumen(user, id);
  }

  @Permissions('caja.operar')
  @Post('aperturas-caja/:id/movimientos')
  @ApiOperation({ summary: 'Registra un ingreso, egreso o retiro manual de efectivo' })
  registrarMovimiento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CreateCashMovementDto,
  ) {
    return this.cashService.registrarMovimiento(user, id, dto);
  }

  @Permissions('caja.cerrar')
  @Post('aperturas-caja/:id/cerrar')
  @ApiOperation({ summary: 'Cierra la sesión de caja y calcula el arqueo (docs/22 §22.6)' })
  cerrar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CloseCashDto,
  ) {
    return this.cashService.cerrar(user, id, dto);
  }
}
