import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreateDestinoPagoDto } from './dto/create-destino-pago.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { UpdateDestinoPagoDto } from './dto/update-destino-pago.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('pagos')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions('pagos.registrar')
  @Get('metodos-pago')
  @ApiOperation({ summary: 'Lista métodos de pago activos' })
  findAllMetodos() {
    return this.paymentsService.findAllMetodos();
  }

  @Permissions('pagos.registrar')
  @Get('destinos-pago')
  @ApiOperation({ summary: 'Lista destinos de pago activos' })
  findAllDestinos() {
    return this.paymentsService.findAllDestinos();
  }

  @Permissions('config.gestionar')
  @Post('destinos-pago')
  @ApiOperation({ summary: 'Crea un destino de pago (cuenta bancaria, POS, billetera, caja)' })
  createDestino(@Body() dto: CreateDestinoPagoDto) {
    return this.paymentsService.createDestino(dto);
  }

  @Permissions('config.gestionar')
  @Patch('destinos-pago/:id')
  @ApiOperation({ summary: 'Edita un destino de pago' })
  updateDestino(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateDestinoPagoDto) {
    return this.paymentsService.updateDestino(id, dto);
  }

  @Permissions('pagos.registrar')
  @Get('pagos')
  @ApiOperation({ summary: 'Lista pagos de las sedes de cobro autorizadas' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentsQueryDto) {
    return this.paymentsService.findAll(user, query);
  }

  @Permissions('pagos.registrar')
  @Get('pagos/:id')
  @ApiOperation({ summary: 'Detalle de un pago' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.paymentsService.findOne(user, id);
  }

  @Permissions('pagos.registrar')
  @Post('pagos')
  @ApiOperation({
    summary: 'Registra un pago aplicado a un financiamiento (RB-022/027, CA-PAY-01)',
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Permissions('pagos.anular')
  @Post('pagos/:id/anular')
  @ApiOperation({ summary: 'Anula un pago confirmado' })
  anular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: VoidPaymentDto,
  ) {
    return this.paymentsService.anular(user, id, dto);
  }
}
