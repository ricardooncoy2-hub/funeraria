import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

describe('Caja (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  let branch: { id: bigint };
  let category: { id: bigint };
  let product: { id: bigint };
  let customer: { id: bigint };
  let caja: { id: bigint };
  let destinoCaja: { id: bigint };
  let metodoEfectivoId: bigint;

  /** El producto de prueba cuesta 1000; el financiamiento debe cuadrar con ese total (RB-021). */
  const PRECIO_PRODUCTO = 1000;

  async function crearVentaConFinanciamientoCliente(): Promise<bigint> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sedeVentaId: branch.id.toString(),
        clienteId: customer.id.toString(),
        items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 1 }],
        financings: [{ origenTipo: 'CLIENTE', monto: PRECIO_PRODUCTO }],
      })
      .expect(201);
    return BigInt(res.body.financings[0].id as string);
  }

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
      data: { codigo: `E2EC${suffix}`.slice(0, 20), nombre: 'E2E Caja' },
    });
    category = await prisma.productCategory.create({ data: { nombre: `E2E Cat Caja ${suffix}` } });
    product = await prisma.product.create({
      data: {
        codigo: `E2ECP-${suffix}`,
        nombre: 'E2E Producto Caja',
        categoriaProductoId: category.id,
        unidadMedida: 'UNIDAD',
        precioVenta: 1000,
        afectoIgv: false,
      },
    });
    customer = await prisma.customer.create({
      data: {
        tipoDocumento: 'DNI',
        numeroDocumento: `E2EC${suffix}`.slice(0, 20),
        nombres: 'E2E Cliente Caja',
      },
    });
    await prisma.inventory.create({
      data: { sedeId: branch.id, productoId: product.id, stockActual: 10, costoPromedio: 0 },
    });

    caja = await prisma.cash.create({
      data: { sedeId: branch.id, nombre: `E2E Caja Fisica ${suffix}` },
    });
    destinoCaja = await prisma.destinoPago.create({
      data: { tipo: 'CAJA', nombre: `E2E Destino Caja ${suffix}`, cajaId: caja.id },
    });

    const metodoEfectivo = await prisma.paymentMethod.findFirstOrThrow({
      where: { esEfectivo: true },
    });
    metodoEfectivoId = metodoEfectivo.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usuario: ADMIN_USER, password: ADMIN_PASSWORD })
      .expect(201);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.cashMovement.deleteMany({ where: { cajaId: caja.id } });
    await prisma.payment.deleteMany({ where: { sedeCobroId: branch.id } });
    await prisma.cashOpening.deleteMany({ where: { cajaId: caja.id } });
    await prisma.financing.deleteMany({ where: { venta: { sedeVentaId: branch.id } } });
    await prisma.saleItem.deleteMany({ where: { venta: { sedeVentaId: branch.id } } });
    await prisma.sale.deleteMany({ where: { sedeVentaId: branch.id } });
    await prisma.inventoryMovement.deleteMany({ where: { productoId: product.id } });
    await prisma.inventory.deleteMany({ where: { productoId: product.id } });
    await prisma.destinoPago.deleteMany({ where: { id: destinoCaja.id } });
    await prisma.cash.deleteMany({ where: { id: caja.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.productCategory.delete({ where: { id: category.id } });
    await prisma.branch.delete({ where: { id: branch.id } });
    await app.close();
  });

  describe('CA-CASH-01: no se puede registrar efectivo sin caja abierta', () => {
    it('rechaza un pago en efectivo si la caja no tiene apertura vigente', async () => {
      const financiamientoId = await crearVentaConFinanciamientoCliente();

      const res = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId: financiamientoId.toString(),
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: PRECIO_PRODUCTO,
        })
        .expect(409);
      expect(res.body.error.code).toBe('CAJA_NO_ABIERTA');
    });
  });

  describe('Apertura de caja (RB-026)', () => {
    it('abre la caja y rechaza una segunda apertura simultánea', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/cajas/${caja.id}/aperturas`)
        .set('Authorization', `Bearer ${token}`)
        .send({ saldoInicial: 100 })
        .expect(201);
      expect(res.body.estado).toBe('ABIERTA');

      const dup = await request(app.getHttpServer())
        .post(`/api/v1/cajas/${caja.id}/aperturas`)
        .set('Authorization', `Bearer ${token}`)
        .send({ saldoInicial: 0 })
        .expect(409);
      expect(dup.body.error.code).toBe('CAJA_YA_ABIERTA');
    });
  });

  describe('CA-PAY-04: pago en efectivo con caja abierta', () => {
    it('genera un movimiento VENTA_EFECTIVO vinculado al pago', async () => {
      const financiamientoId = await crearVentaConFinanciamientoCliente();

      const pago = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId: financiamientoId.toString(),
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: PRECIO_PRODUCTO,
        })
        .expect(201);
      expect(pago.body.aperturaCajaId).not.toBeNull();

      const apertura = await prisma.cashOpening.findFirstOrThrow({
        where: { cajaId: caja.id, estado: 'ABIERTA' },
      });
      const resumen = await request(app.getHttpServer())
        .get(`/api/v1/aperturas-caja/${apertura.id}/resumen`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(resumen.body.totales.VENTA_EFECTIVO).toBe('1000');
      expect(resumen.body.saldoTeorico).toBe('1100');
    });

    it('rechaza el tipo VENTA_EFECTIVO en el endpoint manual de movimientos', async () => {
      const apertura = await prisma.cashOpening.findFirstOrThrow({
        where: { cajaId: caja.id, estado: 'ABIERTA' },
      });
      await request(app.getHttpServer())
        .post(`/api/v1/aperturas-caja/${apertura.id}/movimientos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tipo: 'VENTA_EFECTIVO', monto: 10, concepto: 'no permitido' })
        .expect(400);
    });
  });

  describe('Anulación de pago en efectivo (docs/22 §22.5)', () => {
    it('registra un movimiento EGRESO de reverso y restaura el saldo teórico', async () => {
      const apertura = await prisma.cashOpening.findFirstOrThrow({
        where: { cajaId: caja.id, estado: 'ABIERTA' },
      });
      const financiamientoId = await crearVentaConFinanciamientoCliente();

      const pago = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId: financiamientoId.toString(),
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: PRECIO_PRODUCTO,
        })
        .expect(201);

      const antes = await request(app.getHttpServer())
        .get(`/api/v1/aperturas-caja/${apertura.id}/resumen`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const saldoAntes = antes.body.saldoTeorico as string;

      await request(app.getHttpServer())
        .post(`/api/v1/pagos/${pago.body.id}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .send({ motivo: 'Anulación de prueba e2e' })
        .expect(201);

      const despues = await request(app.getHttpServer())
        .get(`/api/v1/aperturas-caja/${apertura.id}/resumen`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Number(despues.body.saldoTeorico)).toBe(Number(saldoAntes) - PRECIO_PRODUCTO);
    });
  });

  describe('Cierre / arqueo (docs/22 §22.6)', () => {
    it('calcula diferencia = contado - esperado y cierra la sesión', async () => {
      const apertura = await prisma.cashOpening.findFirstOrThrow({
        where: { cajaId: caja.id, estado: 'ABIERTA' },
      });
      const resumen = await request(app.getHttpServer())
        .get(`/api/v1/aperturas-caja/${apertura.id}/resumen`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const saldoEsperado = Number(resumen.body.saldoTeorico);

      const cierre = await request(app.getHttpServer())
        .post(`/api/v1/aperturas-caja/${apertura.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)
        .send({ saldoContado: saldoEsperado + 5 })
        .expect(201);

      expect(cierre.body.estado).toBe('CERRADA');
      expect(Number(cierre.body.saldoEsperado)).toBe(saldoEsperado);
      expect(Number(cierre.body.diferencia)).toBe(5);

      const cerrarDeNuevo = await request(app.getHttpServer())
        .post(`/api/v1/aperturas-caja/${apertura.id}/cerrar`)
        .set('Authorization', `Bearer ${token}`)
        .send({ saldoContado: 0 })
        .expect(409);
      expect(cerrarDeNuevo.body.error.code).toBe('APERTURA_YA_CERRADA');
    });
  });
});
