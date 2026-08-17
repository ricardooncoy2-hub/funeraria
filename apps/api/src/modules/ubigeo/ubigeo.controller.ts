import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { DistritoQueryDto, ProvinciaQueryDto } from './dto/ubigeo-query.dto';
import { UbigeoService } from './ubigeo.service';

/**
 * Catálogo de referencia puro (nombres de lugares de Perú, sin dato
 * sensible) — sin `@Permissions`, cualquier usuario autenticado puede
 * leerlo (lo consumen formularios con permisos distintos: sedes.gestionar,
 * ventas.crear, compras.gestionar).
 */
@ApiTags('ubigeo')
@Controller('ubigeo')
export class UbigeoController {
  constructor(private readonly ubigeoService: UbigeoService) {}

  @Get('departamentos')
  @ApiOperation({ summary: 'Lista los departamentos del Perú' })
  findAllDepartamentos() {
    return this.ubigeoService.findAllDepartamentos();
  }

  @Get('provincias')
  @ApiOperation({ summary: 'Lista provincias, opcionalmente filtradas por departamento' })
  findProvincias(@Query() query: ProvinciaQueryDto) {
    return this.ubigeoService.findProvincias(
      query.departamentoId ? BigInt(query.departamentoId) : undefined,
    );
  }

  @Get('distritos')
  @ApiOperation({ summary: 'Lista distritos, opcionalmente filtrados por provincia' })
  findDistritos(@Query() query: DistritoQueryDto) {
    return this.ubigeoService.findDistritos(
      query.provinciaId ? BigInt(query.provinciaId) : undefined,
    );
  }

  @Get('distritos/:id')
  @ApiOperation({
    summary: 'Un distrito con su provincia y departamento (para hidratar formularios)',
  })
  findOneDistrito(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.ubigeoService.findOneDistrito(id);
  }
}
