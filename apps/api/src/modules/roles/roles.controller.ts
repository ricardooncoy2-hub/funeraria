import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Lista roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permisos')
  @ApiOperation({ summary: 'Lista el catálogo completo de permisos' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Detalle de un rol con sus permisos' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.rolesService.findOne(id);
  }

  @Permissions('roles.gestionar')
  @Post('roles')
  @ApiOperation({ summary: 'Crea un rol (RF-010)' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Permissions('roles.gestionar')
  @Patch('roles/:id')
  @ApiOperation({ summary: 'Edita un rol' })
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Permissions('roles.gestionar')
  @Patch('roles/:id/permisos')
  @ApiOperation({ summary: 'Reemplaza el conjunto de permisos de un rol' })
  setPermissions(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: SetRolePermissionsDto) {
    return this.rolesService.setPermissions(id, dto);
  }
}
