import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../modules/authz/authz.types';
import { RolesGuard } from './roles.guard';

function buildContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

const user: AuthenticatedUser = {
  id: 2n,
  correo: 'v@x.pe',
  usuario: 'vendedor',
  nombres: 'V',
  apellidos: 'C',
  esCorporativo: false,
  mustChangePassword: false,
  roles: ['vendedor'],
  permisos: ['ventas.crear'],
  sedeIds: [2n],
  isCorporate: false,
};

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('permite el acceso si el endpoint no declara @Roles ni @Permissions', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(buildContext(user))).toBe(true);
  });

  it('lanza 401 si no hay usuario autenticado pero el endpoint exige permisos', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'permissions' ? ['ventas.crear'] : undefined,
    );
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(UnauthorizedException);
  });

  it('permite el acceso si el usuario tiene el permiso requerido', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'permissions' ? ['ventas.crear'] : undefined,
    );
    expect(guard.canActivate(buildContext(user))).toBe(true);
  });

  it('lanza 403 si al usuario le falta un permiso requerido', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'permissions' ? ['caja.cerrar'] : undefined,
    );
    expect(() => guard.canActivate(buildContext(user))).toThrow(ForbiddenException);
  });

  it('permite el acceso si el usuario tiene al menos uno de los roles requeridos', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'roles' ? ['vendedor', 'admin_sede'] : undefined,
    );
    expect(guard.canActivate(buildContext(user))).toBe(true);
  });

  it('lanza 403 si el usuario no tiene ninguno de los roles requeridos', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'roles' ? ['admin_corporativo'] : undefined,
    );
    expect(() => guard.canActivate(buildContext(user))).toThrow(ForbiddenException);
  });
});
