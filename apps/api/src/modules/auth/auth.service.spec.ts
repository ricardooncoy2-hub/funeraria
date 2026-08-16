import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../authz/authz.types';
import { SedeScopeService } from '../authz/sede-scope.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; update: jest.Mock; findUniqueOrThrow: jest.Mock };
    refreshToken: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let sedeScopeService: { buildUserContext: jest.Mock };

  const PASSWORD = 'ClaveSegura123';
  let passwordHash: string;

  const fakeUserContext: AuthenticatedUser = {
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

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
      refreshToken: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    sedeScopeService = { buildUserContext: jest.fn().mockResolvedValue(fakeUserContext) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('access.jwt.token') },
        },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('7') } },
        { provide: SedeScopeService, useValue: sedeScopeService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('rechaza credenciales inválidas sin filtrar si el usuario existe', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login('nadie', 'x', {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza password incorrecta', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1n, passwordHash });
      await expect(service.login('admin', 'incorrecta', {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('emite accessToken + refreshToken y actualiza ultimo_login_at con credenciales válidas', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1n, passwordHash });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login('admin', PASSWORD, { ip: '127.0.0.1' });

      expect(result.accessToken).toBe('access.jwt.token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBe(fakeUserContext);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1n } }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refresh — rotación y reuso', () => {
    it('rota el token: revoca el anterior y crea uno nuevo', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 10n,
        usuarioId: 1n,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('token-valido', {});

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 10n },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.accessToken).toBe('access.jwt.token');
    });

    it('un token ya revocado (reuso) revoca toda la sesión y lanza 401', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 10n,
        usuarioId: 1n,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.refresh('token-reusado', {})).rejects.toMatchObject({
        response: { code: 'REFRESH_REUTILIZADO' },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { usuarioId: 1n, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('un token expirado lanza 401', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 10n,
        usuarioId: 1n,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh('token-expirado', {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('un token inexistente lanza 401', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);
      await expect(service.refresh('token-desconocido', {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('rechaza si la contraseña actual no coincide', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 1n, passwordHash });
      await expect(service.changePassword(1n, 'incorrecta', 'NuevaClave123')).rejects.toMatchObject(
        {
          response: { code: 'PASSWORD_INCORRECTA' },
        },
      );
    });

    it('actualiza el hash y revoca las sesiones activas', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 1n, passwordHash });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.changePassword(1n, PASSWORD, 'NuevaClave123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1n },
          data: expect.objectContaining({ mustChangePassword: false }),
        }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { usuarioId: 1n, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
