import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

describe('Auth + CA-SEC-01 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('rechaza credenciales inválidas con 401 y formato de error uniforme', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ usuario: ADMIN_USER, password: 'clave-incorrecta' })
        .expect(401);

      expect(res.body.error.code).toBe('CREDENCIALES_INVALIDAS');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('acepta el usuario admin sembrado y devuelve accessToken + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ usuario: ADMIN_USER, password: ADMIN_PASSWORD })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.isCorporate).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me sin token', () => {
    it('responde 401 NO_AUTENTICADO', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
      expect(res.body.error.code).toBe('NO_AUTENTICADO');
    });
  });

  describe('CA-SEC-01: aislamiento por sede en gestión de usuarios', () => {
    let branchA: { id: bigint };
    let branchB: { id: bigint };
    let adminSedeAToken: string;
    let userInBranchBId: bigint;

    beforeAll(async () => {
      const suffix = Date.now();
      branchA = await prisma.branch.create({
        data: { codigo: `E2EA${suffix}`, nombre: 'E2E Sede A' },
      });
      branchB = await prisma.branch.create({
        data: { codigo: `E2EB${suffix}`, nombre: 'E2E Sede B' },
      });

      const adminSedeRole = await prisma.role.findUniqueOrThrow({
        where: { codigo: 'admin_sede' },
      });
      const passwordHash = await bcrypt.hash('ClaveSegura123', 4);

      const adminSedeA = await prisma.user.create({
        data: {
          nombres: 'E2E',
          apellidos: 'AdminSedeA',
          correo: `e2e-admin-a-${suffix}@test.local`,
          usuario: `e2e_admin_a_${suffix}`,
          passwordHash,
          userRoles: { create: { rolId: adminSedeRole.id } },
          userBranches: { create: { sedeId: branchA.id } },
        },
      });

      const userB = await prisma.user.create({
        data: {
          nombres: 'E2E',
          apellidos: 'UsuarioSedeB',
          correo: `e2e-user-b-${suffix}@test.local`,
          usuario: `e2e_user_b_${suffix}`,
          passwordHash,
          userBranches: { create: { sedeId: branchB.id } },
        },
      });
      userInBranchBId = userB.id;

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ usuario: adminSedeA.usuario, password: 'ClaveSegura123' })
        .expect(201);
      adminSedeAToken = login.body.accessToken as string;
    });

    afterAll(async () => {
      await prisma.userRole.deleteMany({
        where: { user: { correo: { contains: '@test.local' } } },
      });
      await prisma.userBranch.deleteMany({
        where: { user: { correo: { contains: '@test.local' } } },
      });
      await prisma.refreshToken.deleteMany({
        where: { user: { correo: { contains: '@test.local' } } },
      });
      await prisma.user.deleteMany({ where: { correo: { contains: '@test.local' } } });
      await prisma.branch.deleteMany({ where: { id: { in: [branchA.id, branchB.id] } } });
    });

    it('un admin_sede de la Sede A recibe 403 al intentar gestionar un usuario de la Sede B', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/usuarios/${userInBranchBId}/roles`)
        .set('Authorization', `Bearer ${adminSedeAToken}`)
        .send({ roles: ['vendedor'] })
        .expect(403);

      expect(res.body.error.code).toBe('SEDE_NO_AUTORIZADA');
    });
  });
});
