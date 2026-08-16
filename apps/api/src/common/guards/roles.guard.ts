import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../modules/authz/authz.types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length && !permissions?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'NO_AUTENTICADO',
        message: 'Token de acceso requerido.',
      });
    }

    if (roles?.length && !roles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException({
        code: 'ROL_NO_AUTORIZADO',
        message: 'Su rol no tiene acceso a este recurso.',
      });
    }

    if (
      permissions?.length &&
      !permissions.every((permission) => user.permisos.includes(permission))
    ) {
      throw new ForbiddenException({
        code: 'PERMISO_NO_AUTORIZADO',
        message: 'No tiene el permiso requerido.',
      });
    }

    return true;
  }
}
