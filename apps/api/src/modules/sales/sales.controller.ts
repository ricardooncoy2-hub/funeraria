import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreateSaleDto } from './dto/create-sale.dto';
import { VoidSaleDto } from './dto/void-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('ventas')
@Controller('ventas')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista ventas de las sedes autorizadas' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.salesService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una venta' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.salesService.findOne(user, id);
  }

  @Get(':id/estado-cuenta')
  @ApiOperation({ summary: 'Total, financiado, cobrado y por cobrar de la venta (docs/20 §20.8)' })
  estadoCuenta(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.salesService.estadoCuenta(user, id);
  }

  @Permissions('ventas.crear')
  @Post()
  @ApiOperation({
    summary: 'Crea una venta: detalle, stock y financiamiento (RF-090..096, CA-SALE-01/02)',
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user, dto);
  }

  @Permissions('ventas.anular')
  @Post(':id/anular')
  @ApiOperation({ summary: 'Anula una venta con reversión de inventario (RF-095, CA-SALE-03)' })
  anular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: VoidSaleDto,
  ) {
    return this.salesService.anular(user, id, dto);
  }
}
