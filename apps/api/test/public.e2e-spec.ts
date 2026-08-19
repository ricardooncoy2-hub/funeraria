import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Público (e2e) — CA-QUO-01, CA-DP-01', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/public/servicios|productos|planes|sedes', () => {
    it('responden 200 sin Authorization', async () => {
      await request(app.getHttpServer()).get('/api/v1/public/servicios').expect(200);
      await request(app.getHttpServer()).get('/api/v1/public/productos').expect(200);
      await request(app.getHttpServer()).get('/api/v1/public/planes').expect(200);
      await request(app.getHttpServer()).get('/api/v1/public/sedes').expect(200);
    });

    it('no incluye servicios inactivos', async () => {
      const suffix = Date.now();
      const inactivo = await prisma.service.create({
        data: {
          codigo: `E2EINACT${suffix}`,
          nombre: `E2E Servicio Inactivo ${suffix}`,
          precioBase: 100,
          isActive: false,
        },
      });

      const res = await request(app.getHttpServer()).get('/api/v1/public/servicios').expect(200);
      const codigos = (res.body as { codigo: string }[]).map((s) => s.codigo);
      expect(codigos).not.toContain(inactivo.codigo);

      await prisma.service.delete({ where: { id: inactivo.id } });
    });

    it('GET /public/servicios/:codigo inexistente responde 404', async () => {
      await request(app.getHttpServer()).get('/api/v1/public/servicios/NO-EXISTE').expect(404);
    });
  });

  describe('POST /api/v1/public/cotizaciones', () => {
    afterEach(async () => {
      await prisma.quotation.deleteMany({
        where: { origen: 'WEB', solicitanteTelefono: '999000111' },
      });
    });

    it('crea la cotización con origen WEB, estado SOLICITADA y consentimiento registrado (CA-QUO-01)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/public/cotizaciones')
        .send({
          solicitanteNombres: 'Visitante E2E',
          solicitanteTelefono: '999000111',
          consentimientoDatos: true,
        })
        .expect(201);

      expect(res.body.origen).toBe('WEB');
      expect(res.body.estado).toBe('SOLICITADA');
      expect(res.body.consentimientoDatos).toBe(true);
    });

    it('rechaza con 400 si consentimientoDatos es false, y no crea el registro (CA-DP-01)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/public/cotizaciones')
        .send({
          solicitanteNombres: 'Visitante E2E',
          solicitanteTelefono: '999000111',
          consentimientoDatos: false,
        })
        .expect(400);

      expect(res.body.error.code).toBe('CONSENTIMIENTO_REQUERIDO');

      const count = await prisma.quotation.count({
        where: { origen: 'WEB', solicitanteTelefono: '999000111' },
      });
      expect(count).toBe(0);
    });

    it('rechaza clienteId con 400 (campo no permitido en el DTO público)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/public/cotizaciones')
        .send({
          solicitanteNombres: 'Visitante E2E',
          solicitanteTelefono: '999000111',
          consentimientoDatos: true,
          clienteId: '1',
        })
        .expect(400);
    });
  });
});
