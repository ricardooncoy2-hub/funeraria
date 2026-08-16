import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { KardexQueryDto } from './dto/kardex-query.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventarios')
@Permissions('inventario.leer')
@Controller('inventarios')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Stock por sede (RF-040), filtrable por sede_id/producto_id' })
  findStock(@CurrentUser() user: AuthenticatedUser, @Query() query: StockQueryDto) {
    return this.inventoryService.findStock(user, query);
  }

  @Get('stock-bajo')
  @ApiOperation({ summary: 'Productos en o bajo su stock mínimo (RF-044)' })
  findLowStock(@CurrentUser() user: AuthenticatedUser, @Query('sedeId') sedeId?: string) {
    return this.inventoryService.findLowStock(user, sedeId);
  }

  @Get('kardex')
  @ApiOperation({ summary: 'Kardex reconstruido de un producto en una sede (RF-043)' })
  kardex(@CurrentUser() user: AuthenticatedUser, @Query() query: KardexQueryDto) {
    return this.inventoryService.kardex(user, query);
  }

  @Permissions('inventario.ajustar')
  @Post('ajustes')
  @ApiOperation({ summary: 'Ajuste manual de entrada/salida o merma (RF-045, motivo obligatorio)' })
  createAdjustment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdjustmentDto) {
    return this.inventoryService.createAdjustment(user, dto);
  }
}
