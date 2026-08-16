import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/authz/authz.types';
import { SedeScopeService } from '../../modules/authz/sede-scope.service';
import { SEDE_SCOPE_KEY } from '../decorators/require-sede-scope.decorator';

@Injectable()
export class SedeScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const field = this.reflector.getAllAndOverride<string>(SEDE_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!field) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new UnauthorizedException({
        code: 'NO_AUTENTICADO',
        message: 'Token de acceso requerido.',
      });
    }

    const body = request.body as Record<string, unknown> | undefined;
    const params = request.params as Record<string, unknown> | undefined;
    const query = request.query as Record<string, unknown> | undefined;
    const raw = body?.[field] ?? params?.[field] ?? query?.[field];

    // Campo ausente: el service debe aplicar el alcance por defecto
    // (SedeScopeService.authorizedSedeIds), no es responsabilidad del guard.
    if (raw === undefined || raw === null || raw === '') return true;
    if (typeof raw !== 'string' && typeof raw !== 'number') return true;

    this.sedeScopeService.assertSedeAccess(request.user, BigInt(raw));
    return true;
  }
}
