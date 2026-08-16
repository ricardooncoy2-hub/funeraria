import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import type { AuthenticatedUser } from '../authz/authz.types';
import { CreateUserDto } from './dto/create-user.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { SetUserSedesDto } from './dto/set-user-sedes.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('usuarios')
@Permissions('usuarios.gestionar')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuarios (paginado)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un usuario con sus roles y sedes' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un usuario (RF-005)' })
  create(@CurrentUser() requester: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(requester, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita un usuario' })
  update(
    @CurrentUser() requester: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(requester, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactiva un usuario (soft delete, RF-005)' })
  remove(@CurrentUser() requester: AuthenticatedUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.usersService.remove(requester, id);
  }

  @Patch(':id/sedes')
  @ApiOperation({ summary: 'Reemplaza las sedes asignadas al usuario (RF-006)' })
  setSedes(
    @CurrentUser() requester: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SetUserSedesDto,
  ) {
    return this.usersService.setSedes(requester, id, dto);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Reemplaza los roles asignados al usuario (RF-006)' })
  setRoles(
    @CurrentUser() requester: AuthenticatedUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SetUserRolesDto,
  ) {
    return this.usersService.setRoles(requester, id, dto);
  }
}
