import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from './authz.types';

@Injectable()
export class SedeScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Construye el contexto de autorización completo de un usuario (roles, permisos, sedes). */
  async buildUserContext(usuarioId: bigint): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: usuarioId, deletedAt: null },
      include: {
        userRoles: {
          include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        },
        userBranches: { where: { isActive: true }, select: { sedeId: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'Usuario no encontrado o inactivo.',
      });
    }

    const roles = [...new Set(user.userRoles.map((ur) => ur.role.codigo))];
    const permisos = [
      ...new Set(
        user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.codigo)),
      ),
    ];
    const isCorporate = user.esCorporativo || permisos.includes('sede.acceso_total');

    return {
      id: user.id,
      correo: user.correo,
      usuario: user.usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      esCorporativo: user.esCorporativo,
      mustChangePassword: user.mustChangePassword,
      roles,
      permisos,
      sedeIds: isCorporate ? [] : user.userBranches.map((ub) => ub.sedeId),
      isCorporate,
    };
  }

  /** Sedes activas efectivamente autorizadas (resuelve "todas" para usuarios corporativos). */
  async authorizedSedeIds(user: AuthenticatedUser): Promise<bigint[]> {
    if (!user.isCorporate) return user.sedeIds;
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  hasSedeAccess(user: AuthenticatedUser, sedeId: bigint): boolean {
    return user.isCorporate || user.sedeIds.includes(sedeId);
  }

  /** RB-018: nunca confiar en el sede_id del cliente sin validarlo contra el alcance del usuario. */
  assertSedeAccess(user: AuthenticatedUser, sedeId: bigint): void {
    if (!this.hasSedeAccess(user, sedeId)) {
      throw new ForbiddenException({
        code: 'SEDE_NO_AUTORIZADA',
        message: 'No tiene acceso a la sede solicitada.',
      });
    }
  }
}
