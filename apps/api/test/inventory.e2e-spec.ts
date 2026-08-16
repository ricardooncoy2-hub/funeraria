import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

describe('Inventario / Compras / Transferencias (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  let category: { id: bigint };
  let product: { id: bigint };
  let supplier: { id: bigint };
  let branchOrigin: { id: bigint; codigo: string };
  let branchDest: { id: bigint };
  let principal: { id: bigint };

  let purchaseId: bigint;
  let transferId: bigint;

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
    category = await prisma.productCategory.create({ data: { nombre: `E2E Categoria ${suffix}` } });
    product = await prisma.product.create({
      data: {
        codigo: `E2E-${suffix}`,
        nombre: 'E2E Producto',
        categoriaProductoId: category.id,
        unidadMedida: 'UNIDAD',
        precioVenta: 100,
      },
    });
    supplier = await prisma.supplier.create({
      data: {
        tipoDocumento: 'RUC',
        numeroDocumento: `E2E${suffix}`.slice(0, 20),
        razonSocial: 'E2E Proveedor',
      },
    });
    branchOrigin = await prisma.branch.create({
      data: { codigo: `E2EO${suffix}`.slice(0, 20), nombre: 'E2E Origen' },
    });
    branchDest = await prisma.branch.create({
      data: { codigo: `E2ED${suffix}`.slice(0, 20), nombre: 'E2E Destino' },
    });
    const mainBranch = await prisma.branch.findFirstOrThrow({
      where: { isMain: true, isActive: true },
    });
    principal = { id: mainBranch.id };

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usuario: ADMIN_USER, password: ADMIN_PASSWORD })
      .expect(201);
    token = login.body.accessToken as string;

    // El flujo de transferencia usa un origen propio del test, así que hay que
    // darle stock inicial vía un ajuste de entrada (evita depender de compras).
    await prisma.$transaction((tx) =>
      tx.inventory.create({
        data: {
          sedeId: branchOrigin.id,
          productoId: product.id,
          stockActual: 5,
          costoPromedio: 50,
        },
      }),
    );
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { productoId: product.id } });
    await prisma.inventory.deleteMany({ where: { productoId: product.id } });
    await prisma.inventoryTransferItem.deleteMany({ where: { productoId: product.id } });
    await prisma.inventoryTransfer.deleteMany({ where: { sedeOrigenId: branchOrigin.id } });
    await prisma.purchaseItem.deleteMany({ where: { productoId: product.id } });
    await prisma.purchase.deleteMany({ where: { proveedorId: supplier.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.productCategory.delete({ where: { id: category.id } });
    await prisma.supplier.delete({ where: { id: supplier.id } });
    await prisma.branch.delete({ where: { id: branchOrigin.id } });
    await prisma.branch.delete({ where: { id: branchDest.id } });
    await app.close();
  });

  describe('CA-PUR-01: recepción de compra', () => {
    it('crea una compra en BORRADOR contra la sede principal', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/compras')
        .set('Authorization', `Bearer ${token}`)
        .send({
          proveedorId: supplier.id.toString(),
          fecha: '2026-08-16',
          items: [{ productoId: product.id.toString(), cantidad: 10, costoUnitario: 80 }],
        })
        .expect(201);

      expect(res.body.sedeId).toBe(principal.id.toString());
      expect(res.body.estado).toBe('BORRADOR');
      purchaseId = BigInt(res.body.id as string);
    });

    it('recepcionar incrementa el inventario de la sede principal y fija el costo promedio', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/compras/${purchaseId}/recepcionar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.estado).toBe('RECIBIDA');

      const inv = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: principal.id, productoId: product.id } },
      });
      expect(inv.stockActual.toString()).toBe('10');
      expect(inv.costoPromedio.toString()).toBe('80');
    });
  });

  describe('CA-INV-02: rechazo por stock insuficiente', () => {
    it('un ajuste de salida mayor al stock disponible responde 409 y no modifica el stock', async () => {
      const before = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branchOrigin.id, productoId: product.id } },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/inventarios/ajustes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeId: branchOrigin.id.toString(),
          productoId: product.id.toString(),
          tipo: 'AJUSTE_SALIDA',
          cantidad: 999,
          motivo: 'e2e stock insuficiente',
        })
        .expect(409);

      expect(res.body.error.code).toBe('STOCK_INSUFICIENTE');

      const after = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branchOrigin.id, productoId: product.id } },
      });
      expect(after.stockActual.toString()).toBe(before.stockActual.toString());
    });
  });

  describe('CA-TRF-01/02: transferencia entre sedes', () => {
    it('recorre SOLICITADA → APROBADA → ENVIADA → RECIBIDA moviendo el stock', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/transferencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeOrigenId: branchOrigin.id.toString(),
          sedeDestinoId: branchDest.id.toString(),
          items: [{ productoId: product.id.toString(), cantidad: 2 }],
        })
        .expect(201);

      transferId = BigInt(create.body.id as string);
      expect(create.body.estado).toBe('SOLICITADA');

      await request(app.getHttpServer())
        .post(`/api/v1/transferencias/${transferId}/aprobar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/transferencias/${transferId}/enviar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const origenTrasEnviar = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branchOrigin.id, productoId: product.id } },
      });
      expect(origenTrasEnviar.stockActual.toString()).toBe('3'); // 5 - 2

      await request(app.getHttpServer())
        .post(`/api/v1/transferencias/${transferId}/recibir`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const destinoTrasRecibir = await prisma.inventory.findUniqueOrThrow({
        where: { sedeId_productoId: { sedeId: branchDest.id, productoId: product.id } },
      });
      expect(destinoTrasRecibir.stockActual.toString()).toBe('2');
      expect(destinoTrasRecibir.costoPromedio.toString()).toBe('50'); // costo transferido del origen
    });

    it('no permite crear una transferencia con la misma sede de origen y destino', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transferencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sedeOrigenId: branchOrigin.id.toString(),
          sedeDestinoId: branchOrigin.id.toString(),
          items: [{ productoId: product.id.toString(), cantidad: 1 }],
        })
        .expect(400);

      expect(res.body.error.code).toBe('SEDE_ORIGEN_DESTINO_IGUAL');
    });
  });
});
