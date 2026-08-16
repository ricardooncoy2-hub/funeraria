import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('sedes')
@Controller('sedes')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista sedes (paginado)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una sede' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.branchesService.findOne(id);
  }

  @Permissions('sedes.gestionar')
  @Post()
  @ApiOperation({ summary: 'Crea una sede (RF-020)' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Permissions('sedes.gestionar')
  @Patch(':id')
  @ApiOperation({ summary: 'Edita una sede' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Permissions('sedes.gestionar')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva una sede (soft delete, RF-022)' })
  remove(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.branchesService.remove(id);
  }

  @Permissions('sedes.gestionar')
  @Patch(':id/principal')
  @ApiOperation({ summary: 'Marca la sede como principal (RF-021/RB-024, transaccional)' })
  setPrincipal(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.branchesService.setPrincipal(id);
  }
}
