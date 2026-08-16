import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../modules/authz/authz.types';
import { SedeScopeService } from '../../modules/authz/sede-scope.service';
import { SedeScopeGuard } from './sede-scope.guard';

function buildContext(
  user: AuthenticatedUser | undefined,
  body: Record<string, unknown> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, body, params: {}, query: {} }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

const branchUser: AuthenticatedUser = {
  id: 2n,
  correo: 'v@x.pe',
  usuario: 'vendedor',
  nombres: 'V',
  apellidos: 'C',
  esCorporativo: false,
  mustChangePassword: false,
  roles: ['vendedor'],
  permisos: [],
  sedeIds: [2n],
  isCorporate: false,
};

describe('SedeScopeGuard (CA-SEC-01)', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let sedeScopeService: SedeScopeService;
  let guard: SedeScopeGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    sedeScopeService = new SedeScopeService({} as never);
    guard = new SedeScopeGuard(reflector as unknown as Reflector, sedeScopeService);
  });

  it('permite el acceso si el endpoint no declara @RequireSedeScope', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(buildContext(branchUser))).toBe(true);
  });

  it('lanza 401 si no hay usuario autenticado', () => {
    reflector.getAllAndOverride.mockReturnValue('sedeId');
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(UnauthorizedException);
  });

  it('permite el acceso si el campo de sede no viene en la request (el service aplica el alcance por defecto)', () => {
    reflector.getAllAndOverride.mockReturnValue('sedeId');
    expect(guard.canActivate(buildContext(branchUser, {}))).toBe(true);
  });

  it('permite el acceso si la sede solicitada está dentro del alcance', () => {
    reflector.getAllAndOverride.mockReturnValue('sedeId');
    expect(guard.canActivate(buildContext(branchUser, { sedeId: '2' }))).toBe(true);
  });

  it('CA-SEC-01: rechaza con 403 si la sede solicitada está fuera del alcance', () => {
    reflector.getAllAndOverride.mockReturnValue('sedeId');
    expect(() => guard.canActivate(buildContext(branchUser, { sedeId: '3' }))).toThrow(
      /no tiene acceso/i,
    );
  });
});
