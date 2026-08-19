import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PublicCreateQuotationDto } from './dto/public-create-quotation.dto';
import { PublicService } from './public.service';

/**
 * Sitio público (`apps/web`, docs/15 §15.1) — sin autenticación. Todas las
 * rutas son de solo lectura salvo la creación de cotizaciones, que lleva un
 * límite de tasa propio (mismo valor que el login, `auth.controller.ts`) como
 * defensa anti-spam sin depender de un captcha de terceros (no hay ninguno
 * especificado en docs/23, y no se introduce una dependencia nueva sin
 * justificar — CLAUDE.md §10).
 */
@ApiTags('público')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('servicios')
  @ApiOperation({ summary: 'Catálogo público de servicios' })
  findAllServicios() {
    return this.publicService.findAllServicios();
  }

  @Get('servicios/:codigo')
  @ApiOperation({ summary: 'Detalle público de un servicio por código' })
  findOneServicio(@Param('codigo') codigo: string) {
    return this.publicService.findOneServicio(codigo);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Catálogo público de productos' })
  findAllProductos() {
    return this.publicService.findAllProductos();
  }

  @Get('planes')
  @ApiOperation({ summary: 'Catálogo público de planes' })
  findAllPlanes() {
    return this.publicService.findAllPlanes();
  }

  @Get('planes/:codigo')
  @ApiOperation({ summary: 'Detalle público de un plan por código, con sus ítems' })
  findOnePlan(@Param('codigo') codigo: string) {
    return this.publicService.findOnePlan(codigo);
  }

  @Get('sedes')
  @ApiOperation({ summary: 'Sedes públicas con dirección completa' })
  findAllSedes() {
    return this.publicService.findAllSedes();
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('cotizaciones')
  @ApiOperation({
    summary: 'Crea una cotización desde el sitio público (docs/23 §23.2, CA-QUO-01)',
  })
  crearCotizacion(@Body() dto: PublicCreateQuotationDto) {
    return this.publicService.crearCotizacionPublica(dto);
  }
}
