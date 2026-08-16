import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('compras')
@Permissions('compras.gestionar')
@Controller('compras')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista compras (RF-053)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.purchasesService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una compra' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchasesService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una compra en BORRADOR (RF-050/RB-001)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita una compra en BORRADOR' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(user, id, dto);
  }

  @Post(':id/recepcionar')
  @ApiOperation({
    summary: 'Recepciona la compra: efecto en inventario + costo promedio (RF-051/052, CA-PUR-01)',
  })
  recepcionar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchasesService.recepcionar(user, id);
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anula una compra en BORRADOR' })
  anular(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchasesService.anular(user, id);
  }
}
