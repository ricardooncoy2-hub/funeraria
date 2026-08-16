import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from './authz.types';
import { SedeScopeService } from './sede-scope.service';

describe('SedeScopeService (CA-SEC-01)', () => {
  let service: SedeScopeService;
  let prisma: {
    user: { findUnique: jest.Mock };
    branch: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      branch: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SedeScopeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SedeScopeService);
  });

  describe('buildUserContext', () => {
    it('marca isCorporate=true si es_corporativo=1, sin necesitar filas en usuario_sede', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        correo: 'a@x.pe',
        usuario: 'admin',
        nombres: 'A',
        apellidos: 'B',
        esCorporativo: true,
        isActive: true,
        mustChangePassword: false,
        userRoles: [],
        userBranches: [],
      });

      const ctx = await service.buildUserContext(1n);

      expect(ctx.isCorporate).toBe(true);
      expect(ctx.sedeIds).toEqual([]);
    });

    it('marca isCorporate=true si el rol otorga el permiso sede.acceso_total', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        correo: 'a@x.pe',
        usuario: 'admin',
        nombres: 'A',
        apellidos: 'B',
        esCorporativo: false,
        isActive: true,
        mustChangePassword: false,
        userRoles: [
          {
            role: {
              codigo: 'admin_corporativo',
              rolePermissions: [{ permission: { codigo: 'sede.acceso_total' } }],
            },
          },
        ],
        userBranches: [],
      });

      const ctx = await service.buildUserContext(1n);
      expect(ctx.isCorporate).toBe(true);
      expect(ctx.permisos).toContain('sede.acceso_total');
    });

    it('un usuario no corporativo solo obtiene sus sedes asignadas', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2n,
        correo: 'v@x.pe',
        usuario: 'vendedor',
        nombres: 'V',
        apellidos: 'C',
        esCorporativo: false,
        isActive: true,
        mustChangePassword: false,
        userRoles: [{ role: { codigo: 'vendedor', rolePermissions: [] } }],
        userBranches: [{ sedeId: 2n }],
      });

      const ctx = await service.buildUserContext(2n);
      expect(ctx.isCorporate).toBe(false);
      expect(ctx.sedeIds).toEqual([2n]);
    });

    it('lanza NotFoundException si el usuario no existe o está inactivo', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.buildUserContext(99n)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('hasSedeAccess / assertSedeAccess', () => {
    const corporateUser: AuthenticatedUser = {
      id: 1n,
      correo: 'a@x.pe',
      usuario: 'admin',
      nombres: 'A',
      apellidos: 'B',
      esCorporativo: true,
      mustChangePassword: false,
      roles: ['admin_corporativo'],
      permisos: ['sede.acceso_total'],
      sedeIds: [],
      isCorporate: true,
    };

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

    it('un usuario corporativo accede a cualquier sede', () => {
      expect(service.hasSedeAccess(corporateUser, 99n)).toBe(true);
    });

    it('un usuario de una sola sede accede a la suya', () => {
      expect(service.hasSedeAccess(branchUser, 2n)).toBe(true);
    });

    it('CA-SEC-01: un usuario de Sede A no accede a Sede B', () => {
      expect(service.hasSedeAccess(branchUser, 3n)).toBe(false);
    });

    it('CA-SEC-01: assertSedeAccess lanza 403 con code SEDE_NO_AUTORIZADA fuera de alcance', () => {
      expect(() => service.assertSedeAccess(branchUser, 3n)).toThrow(ForbiddenException);
      try {
        service.assertSedeAccess(branchUser, 3n);
      } catch (error) {
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: 'SEDE_NO_AUTORIZADA',
        });
      }
    });
  });

  describe('authorizedSedeIds', () => {
    it('resuelve todas las sedes activas para un usuario corporativo', async () => {
      prisma.branch.findMany.mockResolvedValue([{ id: 1n }, { id: 2n }, { id: 3n }]);
      const user: AuthenticatedUser = {
        id: 1n,
        correo: 'a@x.pe',
        usuario: 'admin',
        nombres: 'A',
        apellidos: 'B',
        esCorporativo: true,
        mustChangePassword: false,
        roles: [],
        permisos: [],
        sedeIds: [],
        isCorporate: true,
      };

      const result = await service.authorizedSedeIds(user);
      expect(result).toEqual([1n, 2n, 3n]);
      expect(prisma.branch.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        select: { id: true },
      });
    });

    it('devuelve solo las sedes asignadas para un usuario no corporativo', async () => {
      const user: AuthenticatedUser = {
        id: 2n,
        correo: 'v@x.pe',
        usuario: 'vendedor',
        nombres: 'V',
        apellidos: 'C',
        esCorporativo: false,
        mustChangePassword: false,
        roles: [],
        permisos: [],
        sedeIds: [2n],
        isCorporate: false,
      };

      const result = await service.authorizedSedeIds(user);
      expect(result).toEqual([2n]);
      expect(prisma.branch.findMany).not.toHaveBeenCalled();
    });
  });
});
