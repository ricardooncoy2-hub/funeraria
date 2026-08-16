import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { InventoryTransfersService } from './inventory-transfers.service';

@ApiTags('transferencias')
@Controller('transferencias')
export class InventoryTransfersController {
  constructor(private readonly transfersService: InventoryTransfersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista transferencias donde el usuario tiene alcance (origen o destino)',
  })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.transfersService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una transferencia' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.transfersService.findOne(user, id);
  }

  @Permissions('transferencias.solicitar')
  @Post()
  @ApiOperation({ summary: 'Solicita una transferencia entre sedes (RF-060)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(user, dto);
  }

  @Permissions('transferencias.aprobar')
  @Post(':id/aprobar')
  @ApiOperation({ summary: 'Aprueba una transferencia SOLICITADA' })
  aprobar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.transfersService.aprobar(user, id);
  }

  @Permissions('transferencias.solicitar')
  @Post(':id/enviar')
  @ApiOperation({ summary: 'Envía la transferencia: salida en origen (RF-062, CA-TRF-01)' })
  enviar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.transfersService.enviar(user, id);
  }

  @Permissions('transferencias.recibir')
  @Post(':id/recibir')
  @ApiOperation({ summary: 'Recibe la transferencia: entrada en destino (RF-063, CA-TRF-02)' })
  recibir(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.transfersService.recibir(user, id);
  }

  @Permissions('transferencias.solicitar')
  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancela una transferencia antes de ser enviada' })
  cancelar(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.transfersService.cancelar(user, id);
  }
}
