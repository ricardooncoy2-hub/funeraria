import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: bigint) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role)
      throw new NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: 'Rol no encontrado.' });
    return { ...role, permisos: role.rolePermissions.map((rp) => rp.permission.codigo) };
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({ where: { codigo: dto.codigo } });
    if (exists) {
      throw new ConflictException({
        code: 'ROL_CODIGO_DUPLICADO',
        message: 'Ya existe un rol con ese código.',
      });
    }
    return this.prisma.role.create({ data: dto });
  }

  async update(id: bigint, dto: UpdateRoleDto) {
    await this.assertExists(id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async setPermissions(id: bigint, dto: SetRolePermissionsDto) {
    await this.assertExists(id);

    const permisos = await this.prisma.permission.findMany({
      where: { codigo: { in: dto.permisos } },
    });
    const found = new Set(permisos.map((p) => p.codigo));
    const missing = dto.permisos.filter((codigo) => !found.has(codigo));
    if (missing.length > 0) {
      throw new NotFoundException({
        code: 'PERMISOS_NO_ENCONTRADOS',
        message: `Permisos inexistentes: ${missing.join(', ')}`,
      });
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { rolId: id } }),
      this.prisma.rolePermission.createMany({
        data: permisos.map((p) => ({ rolId: id, permisoId: p.id })),
      }),
    ]);

    return this.findOne(id);
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }] });
  }

  private async assertExists(id: bigint): Promise<void> {
    const exists = await this.prisma.role.findUnique({ where: { id } });
    if (!exists)
      throw new NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: 'Rol no encontrado.' });
  }
}
