import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

describe('Financiamiento / CxC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  let branch: { id: bigint };
  let category: { id: bigint };
  let product: { id: bigint };
  let customer: { id: bigint };
  let financiador: { id: bigint };
  let destinoCaja: { id: bigint };
  let destinoBanco: { id: bigint };
  let metodoEfectivoId: bigint;
  let metodoTransferenciaId: bigint;
  let saleId: bigint;
  let financingClienteId: bigint;
  let financingInstitucionalId: bigint;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    const suffix = Date.now();
    branch = await prisma.branch.create({
      data: { codigo: `E2EF${suffix}`.slice(0, 20), nombre: 'E2E Financiamiento' },
    });
    category = await prisma.productCategory.create({ data: { nombre: `E2E Cat Fin ${suffix}` } });
    product = await prisma.product.create({
      data: {
        codigo: `E2EFP-${suffix}`,
        nombre: 'E2E Producto Financiamiento',
        categoriaProductoId: category.id,
        unidadMedida: 'UNIDAD',
        precioVenta: 5000,
        afectoIgv: false,
      },
    });
    customer = await prisma.customer.create({
      data: {
        tipoDocumento: 'DNI',
        numeroDocumento: `E2EF${suffix}`.slice(0, 20),
        nombres: 'E2E Cliente Fin',
      },
    });
    financiador = await prisma.financiador.create({
      data: { tipo: 'ASEGURADORA', nombre: `E2E Aseguradora ${suffix}`, diasCredito: 30 },
    });

    await prisma.inventory.create({
      data: { sedeId: branch.id, productoId: product.id, stockActual: 5, costoPromedio: 0 },
    });

    destinoCaja = await prisma.destinoPago.create({
      data: { tipo: 'CAJA', nombre: `E2E Caja Fin ${suffix}`, sedeAdministradoraId: branch.id },
    });
    destinoBanco = await prisma.destinoPago.create({
      data: {
        tipo: 'CUENTA_BANCARIA',
        nombre: `E2E Banco Fin ${suffix}`,
        sedeAdministradoraId: branch.id,
      },
    });

    const metodoEfectivo = await prisma.paymentMethod.findFirstOrThrow({
      where: { esEfectivo: true },
    });
    const metodoTransferencia = await prisma.paymentMethod.findFirstOrThrow({
      where: { codigo: 'TRANSFERENCIA' },
    });
    metodoEfectivoId = metodoEfectivo.id;
    metodoTransferenciaId = metodoTransferencia.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usuario: ADMIN_USER, password: ADMIN_PASSWORD })
      .expect(201);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { sedeCobroId: branch.id } });
    await prisma.financing.deleteMany({ where: { venta: { sedeVentaId: branch.id } } });
    await prisma.saleItem.deleteMany({ where: { venta: { sedeVentaId: branch.id } } });
    await prisma.sale.deleteMany({ where: { sedeVentaId: branch.id } });
    await prisma.inventoryMovement.deleteMany({ where: { productoId: product.id } });
    await prisma.inventory.deleteMany({ where: { productoId: product.id } });
    await prisma.destinoPago.deleteMany({
      where: { id: { in: [destinoCaja.id, destinoBanco.id] } },
    });
    await prisma.financiador.delete({ where: { id: financiador.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.productCategory.delete({ where: { id: category.id } });
    await prisma.branch.delete({ where: { id: branch.id } });
    await app.close();
  });

  describe('CA-FIN-01/02: venta con financiamiento mixto', () => {
    it('RB-021: rechaza si la suma de financiamientos no iguala el total', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeVentaId: branch.id.toString(),
          clienteId: customer.id.toString(),
          items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 1 }],
          financings: [{ origenTipo: 'CLIENTE', monto: 1000 }],
        })
        .expect(400);
      expect(res.body.error.code).toBe('FINANCIAMIENTO_NO_CUADRA');
    });

    it('venta 5000 = cliente 3000 + aseguradora 2000 (docs/21 §21.7)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeVentaId: branch.id.toString(),
          clienteId: customer.id.toString(),
          items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 1 }],
          financings: [
            { origenTipo: 'CLIENTE', monto: 3000 },
            { origenTipo: 'FINANCIADOR', financiadorId: financiador.id.toString(), monto: 2000 },
          ],
        })
        .expect(201);

      expect(res.body.total).toBe('5000');
      expect(res.body.financings).toHaveLength(2);
      saleId = BigInt(res.body.id as string);
      const cliente = res.body.financings.find(
        (f: { origenTipo: string }) => f.origenTipo === 'CLIENTE',
      );
      const institucional = res.body.financings.find(
        (f: { origenTipo: string }) => f.origenTipo === 'FINANCIADOR',
      );
      financingClienteId = BigInt(cliente.id as string);
      financingInstitucionalId = BigInt(institucional.id as string);
      expect(institucional.financiadorId).toBe(financiador.id.toString());
    });
  });

  describe('CA-FIN-03: pago del cliente y pago posterior de la aseguradora', () => {
    it('tras el pago del cliente: cobrado 3000, por cobrar 2000', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId: financingClienteId.toString(),
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: 3000,
        })
        .expect(201);

      const estadoCuenta = await request(app.getHttpServer())
        .get(`/api/v1/ventas/${saleId}/estado-cuenta`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(estadoCuenta.body.cobrado).toBe('3000');
      expect(estadoCuenta.body.porCobrar).toBe('2000');
    });

    it('el financiamiento institucional requiere el ciclo DOCUMENTADA→ENVIADA→APROBADA antes de aparecer en CxC', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/financiamientos/${financingInstitucionalId}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'APROBADA' })
        .expect(409);

      for (const estado of ['DOCUMENTADA', 'ENVIADA', 'APROBADA']) {
        await request(app.getHttpServer())
          .patch(`/api/v1/financiamientos/${financingInstitucionalId}/estado`)
          .set('Authorization', `Bearer ${token}`)
          .send({ estado })
          .expect(200);
      }

      const cxc = await request(app.getHttpServer())
        .get('/api/v1/cuentas-por-cobrar')
        .query({ financiadorId: financiador.id.toString() })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(cxc.body).toHaveLength(1);
      expect(cxc.body[0].pendiente).toBe('2000');
    });

    it('tras el pago de la aseguradora: cobrado 5000, por cobrar 0, y sale de CxC', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId: financingInstitucionalId.toString(),
          metodoPagoId: metodoTransferenciaId.toString(),
          destinoPagoId: destinoBanco.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: 2000,
        })
        .expect(201);

      const estadoCuenta = await request(app.getHttpServer())
        .get(`/api/v1/ventas/${saleId}/estado-cuenta`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(estadoCuenta.body.cobrado).toBe('5000');
      expect(estadoCuenta.body.porCobrar).toBe('0');

      const cxc = await request(app.getHttpServer())
        .get('/api/v1/cuentas-por-cobrar')
        .query({ financiadorId: financiador.id.toString() })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(cxc.body).toHaveLength(0);
    });
  });
});
