import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

describe('Ventas / Pagos / Cotizaciones (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  let category: { id: bigint };
  let product: { id: bigint };
  let customer: { id: bigint };
  let branch: { id: bigint };
  let caja: { id: bigint };
  let destinoCaja: { id: bigint };
  let destinoPos: { id: bigint };
  let metodoEfectivoId: bigint;
  let metodoPosId: bigint;

  const saleIds: bigint[] = [];
  const quotationIds: bigint[] = [];

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
      data: { codigo: `E2ES${suffix}`.slice(0, 20), nombre: 'E2E Ventas' },
    });
    category = await prisma.productCategory.create({
      data: { nombre: `E2E Cat Ventas ${suffix}` },
    });
    product = await prisma.product.create({
      data: {
        codigo: `E2ESV-${suffix}`,
        nombre: 'E2E Producto Venta',
        categoriaProductoId: category.id,
        unidadMedida: 'UNIDAD',
        precioVenta: 100,
      },
    });
    customer = await prisma.customer.create({
      data: {
        tipoDocumento: 'DNI',
        numeroDocumento: `E2E${suffix}`.slice(0, 20),
        nombres: 'E2E Cliente',
      },
    });

    // Stock inicial vía ajuste de entrada directo (evita depender de compras).
    await prisma.inventory.create({
      data: { sedeId: branch.id, productoId: product.id, stockActual: 10, costoPromedio: 50 },
    });

    caja = await prisma.cash.create({
      data: { sedeId: branch.id, nombre: `E2E Caja Fisica ${suffix}` },
    });
    await prisma.cashOpening.create({
      data: { cajaId: caja.id, sedeId: branch.id, usuarioAperturaId: 1n, saldoInicial: 0 },
    });
    destinoCaja = await prisma.destinoPago.create({
      data: {
        tipo: 'CAJA',
        nombre: `E2E Caja ${suffix}`,
        sedeAdministradoraId: branch.id,
        cajaId: caja.id,
      },
    });
    destinoPos = await prisma.destinoPago.create({
      data: { tipo: 'POS', nombre: `E2E POS ${suffix}` },
    });

    const metodoEfectivo = await prisma.paymentMethod.findFirstOrThrow({
      where: { esEfectivo: true },
    });
    const metodoPos = await prisma.paymentMethod.findFirstOrThrow({ where: { codigo: 'POS' } });
    metodoEfectivoId = metodoEfectivo.id;
    metodoPosId = metodoPos.id;

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
    await prisma.quotationItem.deleteMany({ where: { productoId: product.id } });
    await prisma.quotation.deleteMany({ where: { clienteId: customer.id } });
    await prisma.inventoryMovement.deleteMany({ where: { productoId: product.id } });
    await prisma.inventory.deleteMany({ where: { productoId: product.id } });
    await prisma.destinoPago.deleteMany({ where: { id: { in: [destinoCaja.id, destinoPos.id] } } });
    await prisma.cash.deleteMany({ where: { id: caja.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.productCategory.delete({ where: { id: category.id } });
    await prisma.branch.delete({ where: { id: branch.id } });
    await app.close();
  });

  describe('CA-SALE-01/02: crear venta', () => {
    it('descuenta stock solo de la sede de venta y financia el 100% al cliente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeVentaId: branch.id.toString(),
          clienteId: customer.id.toString(),
          items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 3 }],
        })
        .expect(201);

      expect(res.body.estado).toBe('CONFIRMADA');
      expect(res.body.financings).toHaveLength(1);
      expect(res.body.financings[0].origenTipo).toBe('CLIENTE');
      expect(res.body.financings[0].monto).toBe(res.body.total);
      saleIds.push(BigInt(res.body.id as string));

      const inv = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branch.id, productoId: product.id } },
      });
      expect(inv.stockActual.toString()).toBe('7'); // 10 - 3
    });

    it('RB-021: no permite ítems con producto inexistente', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeVentaId: branch.id.toString(),
          clienteId: customer.id.toString(),
          items: [{ itemTipo: 'PRODUCTO', productoId: '999999999', cantidad: 1 }],
        })
        .expect(400);
    });
  });

  describe('CA-PAY-01: pagos múltiples aplicados al financiamiento', () => {
    let financiamientoId: string;
    let total: string;

    beforeAll(async () => {
      const sale = await prisma.sale.findUniqueOrThrow({
        where: { id: saleIds[0] },
        include: { financings: true },
      });
      financiamientoId = sale.financings[0].id.toString();
      total = sale.total.toString();
    });

    it('rechaza un pago electrónico contra un destino tipo CAJA (RB-027)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId,
          metodoPagoId: metodoPosId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: 1,
        })
        .expect(400);
      expect(res.body.error.code).toBe('DESTINO_INCOHERENTE');
    });

    it('admite pagos parciales hasta completar el total y luego rechaza el excedente', async () => {
      const mitad = (Number(total) / 2).toFixed(2);

      await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId,
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: Number(mitad),
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId,
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: Number(mitad),
        })
        .expect(201);

      const excedente = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          financiamientoId,
          metodoPagoId: metodoEfectivoId.toString(),
          destinoPagoId: destinoCaja.id.toString(),
          sedeCobroId: branch.id.toString(),
          monto: 1,
        })
        .expect(409);
      expect(excedente.body.error.code).toBe('MONTO_EXCEDE_FINANCIAMIENTO');

      const estadoCuenta = await request(app.getHttpServer())
        .get(`/api/v1/ventas/${saleIds[0]}/estado-cuenta`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(estadoCuenta.body.porCobrar).toBe('0');
    });
  });

  describe('CA-SALE-03: anulación con reversión de inventario', () => {
    it('bloquea la anulación si hay pagos confirmados', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ventas/${saleIds[0]}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .send({ motivo: 'e2e con pagos' })
        .expect(409);
      expect(res.body.error.code).toBe('VENTA_CON_PAGOS_CONFIRMADOS');
    });

    it('reingresa el stock al anular una venta sin pagos', async () => {
      const sale = await request(app.getHttpServer())
        .post('/api/v1/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeVentaId: branch.id.toString(),
          clienteId: customer.id.toString(),
          items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 2 }],
        })
        .expect(201);
      saleIds.push(BigInt(sale.body.id as string));

      const antes = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branch.id, productoId: product.id } },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/ventas/${sale.body.id as string}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .send({ motivo: 'e2e sin pagos' })
        .expect(201);

      const despues = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branch.id, productoId: product.id } },
      });
      expect(despues.stockActual.toString()).toBe(antes.stockActual.add(2).toString());
    });
  });

  describe('CA-QUO-02: convertir cotización en venta', () => {
    it('hereda cliente e ítems y guarda cotizacion_id en la venta', async () => {
      const quotation = await request(app.getHttpServer())
        .post('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origen: 'TELEFONO',
          solicitanteNombres: 'E2E Solicitante',
          solicitanteTelefono: '999000111',
          clienteId: customer.id.toString(),
          consentimientoDatos: true,
          items: [{ itemTipo: 'PRODUCTO', productoId: product.id.toString(), cantidad: 1 }],
        })
        .expect(201);
      const quotationId = quotation.body.id as string;
      quotationIds.push(BigInt(quotationId));

      await request(app.getHttpServer())
        .patch(`/api/v1/cotizaciones/${quotationId}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'EN_REVISION' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/cotizaciones/${quotationId}/asignar`)
        .set('Authorization', `Bearer ${token}`)
        .send({ sedeAsignadaId: branch.id.toString() })
        .expect(201);

      for (const estado of ['CONTACTADA', 'EN_NEGOCIACION', 'ACEPTADA']) {
        await request(app.getHttpServer())
          .patch(`/api/v1/cotizaciones/${quotationId}/estado`)
          .set('Authorization', `Bearer ${token}`)
          .send({ estado })
          .expect(200);
      }

      const converted = await request(app.getHttpServer())
        .post(`/api/v1/cotizaciones/${quotationId}/convertir-venta`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(converted.body.cotizacionId).toBe(quotationId);
      expect(converted.body.clienteId).toBe(customer.id.toString());
      saleIds.push(BigInt(converted.body.id as string));
    });
  });
});
