import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  PaginatedResult,
  PaginationQueryDto,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { CreateUserDto } from './dto/create-user.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { SetUserSedesDto } from './dto/set-user-sedes.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  usuario: true,
  telefono: true,
  esCorporativo: true,
  isActive: true,
  mustChangePassword: true,
  ultimoLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { nombres: { contains: query.q } },
              { apellidos: { contains: query.q } },
              { correo: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { nombres: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, query.page, query.pageSize);
  }

  async findOne(id: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...SAFE_SELECT,
        userRoles: { select: { role: { select: { codigo: true, nombre: true } } } },
        userBranches: {
          where: { isActive: true },
          select: { sedeId: true, branch: { select: { codigo: true, nombre: true } } },
        },
      },
    });
    if (!user)
      throw new NotFoundException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'Usuario no encontrado.',
      });
    return user;
  }

  async create(requester: AuthenticatedUser, dto: CreateUserDto) {
    if (dto.esCorporativo && !requester.isCorporate) {
      throw new ForbiddenException({
        code: 'NO_AUTORIZADO_CORPORATIVO',
        message: 'Solo un usuario con acceso corporativo puede crear usuarios corporativos.',
      });
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ correo: dto.correo }, { usuario: dto.usuario }] },
    });
    if (exists) {
      throw new ConflictException({
        code: 'USUARIO_DUPLICADO',
        message: 'Ya existe un usuario con ese correo o nombre de usuario.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        correo: dto.correo,
        usuario: dto.usuario,
        telefono: dto.telefono,
        esCorporativo: dto.esCorporativo ?? false,
        passwordHash,
        mustChangePassword: true,
      },
      select: SAFE_SELECT,
    });
  }

  async update(requester: AuthenticatedUser, id: bigint, dto: UpdateUserDto) {
    await this.assertManageable(requester, id);
    if (dto.esCorporativo === true && !requester.isCorporate) {
      throw new ForbiddenException({
        code: 'NO_AUTORIZADO_CORPORATIVO',
        message: 'Solo un usuario con acceso corporativo puede otorgar acceso corporativo.',
      });
    }
    return this.prisma.user.update({ where: { id }, data: dto, select: SAFE_SELECT });
  }

  async remove(requester: AuthenticatedUser, id: bigint): Promise<void> {
    await this.assertManageable(requester, id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  /** RF-006: reemplaza las sedes asignadas. admin_sede solo puede asignar sus propias sedes. */
  async setSedes(requester: AuthenticatedUser, id: bigint, dto: SetUserSedesDto) {
    await this.assertManageable(requester, id);
    const sedeIds = dto.sedeIds.map((s) => BigInt(s));

    if (!requester.isCorporate) {
      const notAllowed = sedeIds.filter((sedeId) => !requester.sedeIds.includes(sedeId));
      if (notAllowed.length > 0) {
        throw new ForbiddenException({
          code: 'SEDE_NO_AUTORIZADA',
          message: 'No puede asignar sedes fuera de su propio alcance.',
        });
      }
    }

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: sedeIds }, deletedAt: null },
    });
    if (branches.length !== sedeIds.length) {
      throw new NotFoundException({
        code: 'SEDE_NO_ENCONTRADA',
        message: 'Una o más sedes no existen.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.userBranch.deleteMany({ where: { usuarioId: id } }),
      this.prisma.userBranch.createMany({
        data: sedeIds.map((sedeId) => ({ usuarioId: id, sedeId })),
      }),
    ]);

    return this.findOne(id);
  }

  /** RF-006: reemplaza los roles asignados. admin_sede no puede otorgar admin_corporativo. */
  async setRoles(requester: AuthenticatedUser, id: bigint, dto: SetUserRolesDto) {
    await this.assertManageable(requester, id);

    if (!requester.isCorporate && dto.roles.includes('admin_corporativo')) {
      throw new ForbiddenException({
        code: 'ROL_NO_AUTORIZADO',
        message: 'No puede asignar el rol admin_corporativo.',
      });
    }

    const roles = await this.prisma.role.findMany({ where: { codigo: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) {
      throw new NotFoundException({
        code: 'ROL_NO_ENCONTRADO',
        message: 'Uno o más roles no existen.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { usuarioId: id } }),
      this.prisma.userRole.createMany({ data: roles.map((r) => ({ usuarioId: id, rolId: r.id })) }),
    ]);

    return this.findOne(id);
  }

  /**
   * usuarios.gestionar es "parcial" para admin_sede (docs/16 §16.2): no puede
   * gestionar usuarios corporativos ni usuarios de sedes fuera de su alcance.
   */
  private async assertManageable(requester: AuthenticatedUser, targetId: bigint) {
    const target = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
      include: { userBranches: { where: { isActive: true }, select: { sedeId: true } } },
    });
    if (!target)
      throw new NotFoundException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'Usuario no encontrado.',
      });
    if (requester.isCorporate) return target;

    if (target.esCorporativo) {
      throw new ForbiddenException({
        code: 'NO_AUTORIZADO',
        message: 'No puede gestionar usuarios corporativos.',
      });
    }
    const targetSedeIds = target.userBranches.map((ub) => ub.sedeId);
    const overlap = targetSedeIds.some((sedeId) => requester.sedeIds.includes(sedeId));
    if (targetSedeIds.length > 0 && !overlap) {
      throw new ForbiddenException({
        code: 'SEDE_NO_AUTORIZADA',
        message: 'El usuario no pertenece a ninguna de sus sedes.',
      });
    }
    return target;
  }
}
