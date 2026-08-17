import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

function buildAdapter(databaseUrl: string): PrismaMariaDb {
  const url = new URL(databaseUrl);
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 5,
  });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL no está configurada.');
}

const prisma = new PrismaClient({ adapter: buildAdapter(databaseUrl) });

const ROLES = [
  { codigo: 'admin_corporativo', nombre: 'Administrador corporativo' },
  { codigo: 'admin_sede', nombre: 'Administrador de sede' },
  { codigo: 'vendedor', nombre: 'Vendedor' },
  { codigo: 'encargado_inventario', nombre: 'Encargado de inventario' },
  { codigo: 'encargado_caja', nombre: 'Encargado de caja' },
  { codigo: 'supervisor', nombre: 'Supervisor' },
  { codigo: 'consulta', nombre: 'Consulta (solo lectura)' },
] as const;

// Catálogo y matriz de permisos — fuente: docs/16_seguridad.md §16.2.
const PERMISSIONS = [
  { codigo: 'sede.acceso_total', nombre: 'Acceso a todas las sedes', modulo: 'authz' },
  { codigo: 'config.gestionar', nombre: 'Gestionar configuración de empresa', modulo: 'config' },
  { codigo: 'sedes.gestionar', nombre: 'Gestionar sedes', modulo: 'branches' },
  { codigo: 'usuarios.gestionar', nombre: 'Gestionar usuarios', modulo: 'users' },
  { codigo: 'roles.gestionar', nombre: 'Gestionar roles y permisos', modulo: 'roles' },
  { codigo: 'catalogo.gestionar', nombre: 'Gestionar catálogo (productos/servicios/planes)', modulo: 'catalog' },
  { codigo: 'catalogo.leer', nombre: 'Leer catálogo', modulo: 'catalog' },
  { codigo: 'compras.gestionar', nombre: 'Gestionar compras', modulo: 'purchases' },
  { codigo: 'inventario.leer', nombre: 'Leer inventario', modulo: 'inventory' },
  { codigo: 'inventario.ajustar', nombre: 'Ajustar inventario', modulo: 'inventory' },
  { codigo: 'transferencias.solicitar', nombre: 'Solicitar transferencias', modulo: 'inventory-transfers' },
  { codigo: 'transferencias.aprobar', nombre: 'Aprobar transferencias', modulo: 'inventory-transfers' },
  { codigo: 'transferencias.recibir', nombre: 'Recibir transferencias', modulo: 'inventory-transfers' },
  { codigo: 'ventas.crear', nombre: 'Crear ventas', modulo: 'sales' },
  { codigo: 'ventas.anular', nombre: 'Anular ventas', modulo: 'sales' },
  { codigo: 'cotizaciones.gestionar', nombre: 'Gestionar cotizaciones', modulo: 'quotations' },
  { codigo: 'financiamiento.gestionar', nombre: 'Gestionar financiamiento', modulo: 'financing' },
  { codigo: 'pagos.registrar', nombre: 'Registrar pagos', modulo: 'payments' },
  { codigo: 'pagos.anular', nombre: 'Anular pagos', modulo: 'payments' },
  { codigo: 'caja.operar', nombre: 'Operar caja', modulo: 'cash' },
  { codigo: 'caja.cerrar', nombre: 'Cerrar caja (arqueo)', modulo: 'cash' },
  { codigo: 'reportes.sede', nombre: 'Ver reportes de sede', modulo: 'reports' },
  { codigo: 'reportes.consolidado', nombre: 'Ver reportes consolidados', modulo: 'reports' },
  { codigo: 'auditoria.leer', nombre: 'Leer auditoría', modulo: 'audit' },
] as const;

// admin_sede en usuarios.gestionar/compras.gestionar es "parcial" en la matriz
// (RB-001, RB-018): el permiso se otorga y el service acota por sede.
const ROLE_PERMISSIONS: Record<(typeof ROLES)[number]['codigo'], string[]> = {
  admin_corporativo: PERMISSIONS.map((p) => p.codigo),
  admin_sede: [
    'usuarios.gestionar',
    'catalogo.leer',
    'compras.gestionar',
    'inventario.leer',
    'inventario.ajustar',
    'transferencias.solicitar',
    'transferencias.aprobar',
    'transferencias.recibir',
    'ventas.crear',
    'ventas.anular',
    'cotizaciones.gestionar',
    'financiamiento.gestionar',
    'pagos.registrar',
    'pagos.anular',
    'caja.operar',
    'caja.cerrar',
    'reportes.sede',
    'auditoria.leer',
  ],
  vendedor: [
    'catalogo.leer',
    'inventario.leer',
    'ventas.crear',
    'cotizaciones.gestionar',
    'financiamiento.gestionar',
    'pagos.registrar',
    'reportes.sede',
  ],
  encargado_inventario: [
    'catalogo.leer',
    'inventario.leer',
    'inventario.ajustar',
    'transferencias.solicitar',
    'transferencias.recibir',
    'reportes.sede',
  ],
  encargado_caja: ['catalogo.leer', 'pagos.registrar', 'caja.operar', 'caja.cerrar', 'reportes.sede'],
  supervisor: [
    'catalogo.leer',
    'inventario.leer',
    'transferencias.aprobar',
    'ventas.anular',
    'cotizaciones.gestionar',
    'pagos.anular',
    'caja.cerrar',
    'reportes.sede',
    'reportes.consolidado',
    'auditoria.leer',
  ],
  consulta: ['catalogo.leer', 'inventario.leer', 'reportes.sede'],
};

// Catálogo base: oferta común de una funeraria peruana (docs/15 §15.2,
// docs/32 §32.5 — ejemplos de slug como /servicios/velatorio, /planes/plan-basico).
const PRODUCT_CATEGORIES = [
  { nombre: 'Ataudes', descripcion: 'Ataúdes y cofres funerarios' },
  { nombre: 'Urnas y Cofres', descripcion: 'Urnas para cremación y cofres de restos' },
  { nombre: 'Arreglos Florales', descripcion: 'Coronas y arreglos florales para velatorio' },
  { nombre: 'Accesorios y Insumos', descripcion: 'Cirios, crucifijos y otros accesorios' },
] as const;

const PRODUCTS = [
  { codigo: 'ATD-001', nombre: 'Ataúd Clásico', categoria: 'Ataudes', unidadMedida: 'UND', precioVenta: 1500.0, stockInicial: 15, stockMinimo: 3 },
  { codigo: 'ATD-002', nombre: 'Ataúd Económico', categoria: 'Ataudes', unidadMedida: 'UND', precioVenta: 800.0, stockInicial: 15, stockMinimo: 3 },
  { codigo: 'ATD-003', nombre: 'Ataúd de Lujo', categoria: 'Ataudes', unidadMedida: 'UND', precioVenta: 3500.0, stockInicial: 8, stockMinimo: 2 },
  { codigo: 'ATD-004', nombre: 'Ataúd Infantil', categoria: 'Ataudes', unidadMedida: 'UND', precioVenta: 600.0, stockInicial: 5, stockMinimo: 2 },
  { codigo: 'URN-001', nombre: 'Urna de Cerámica', categoria: 'Urnas y Cofres', unidadMedida: 'UND', precioVenta: 250.0, stockInicial: 20, stockMinimo: 5 },
  { codigo: 'URN-002', nombre: 'Urna Metálica', categoria: 'Urnas y Cofres', unidadMedida: 'UND', precioVenta: 450.0, stockInicial: 15, stockMinimo: 5 },
  { codigo: 'URN-003', nombre: 'Urna de Madera Tallada', categoria: 'Urnas y Cofres', unidadMedida: 'UND', precioVenta: 600.0, stockInicial: 10, stockMinimo: 3 },
  { codigo: 'FLO-001', nombre: 'Arreglo Floral Clásico', categoria: 'Arreglos Florales', unidadMedida: 'UND', precioVenta: 180.0, stockInicial: 25, stockMinimo: 5 },
  { codigo: 'FLO-002', nombre: 'Arreglo Floral Premium', categoria: 'Arreglos Florales', unidadMedida: 'UND', precioVenta: 350.0, stockInicial: 15, stockMinimo: 5 },
  { codigo: 'FLO-003', nombre: 'Corona Fúnebre', categoria: 'Arreglos Florales', unidadMedida: 'UND', precioVenta: 220.0, stockInicial: 20, stockMinimo: 5 },
  { codigo: 'ACC-001', nombre: 'Kit de Cirios y Velas', categoria: 'Accesorios y Insumos', unidadMedida: 'UND', precioVenta: 50.0, stockInicial: 40, stockMinimo: 10 },
  { codigo: 'ACC-002', nombre: 'Libro de Condolencias', categoria: 'Accesorios y Insumos', unidadMedida: 'UND', precioVenta: 40.0, stockInicial: 30, stockMinimo: 10 },
  { codigo: 'ACC-003', nombre: 'Crucifijo Ornamental', categoria: 'Accesorios y Insumos', unidadMedida: 'UND', precioVenta: 60.0, stockInicial: 30, stockMinimo: 10 },
] as const;

const SERVICES = [
  { codigo: 'SRV-001', nombre: 'Velatorio 24 horas', precioBase: 900.0 },
  { codigo: 'SRV-002', nombre: 'Velatorio 48 horas', precioBase: 1500.0 },
  { codigo: 'SRV-003', nombre: 'Servicio de Cremación', precioBase: 1800.0 },
  { codigo: 'SRV-004', nombre: 'Servicio de Inhumación', precioBase: 1200.0 },
  { codigo: 'SRV-005', nombre: 'Traslado de Cuerpo (local)', precioBase: 250.0 },
  { codigo: 'SRV-006', nombre: 'Traslado de Cuerpo (interprovincial)', precioBase: 800.0 },
  { codigo: 'SRV-007', nombre: 'Embalsamamiento / Tanatopraxia', precioBase: 600.0 },
  { codigo: 'SRV-008', nombre: 'Trámites Documentarios', precioBase: 150.0 },
  { codigo: 'SRV-009', nombre: 'Servicio Religioso', precioBase: 300.0 },
  { codigo: 'SRV-010', nombre: 'Transporte de Familiares', precioBase: 200.0 },
  { codigo: 'SRV-011', nombre: 'Alquiler de Carroza Fúnebre', precioBase: 400.0 },
] as const;

const PLANS = [
  {
    codigo: 'PLN-001',
    nombre: 'Plan Básico',
    descripcion:
      'Servicio esencial: ataúd económico, velatorio de 24 horas, traslado local y trámites documentarios.',
    precio: 1900.0,
    items: [
      { itemTipo: 'PRODUCTO', codigo: 'ATD-002', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-001', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-005', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-008', cantidad: 1 },
    ],
  },
  {
    codigo: 'PLN-002',
    nombre: 'Plan Tradicional',
    descripcion:
      'Ataúd clásico, velatorio de 24 horas, traslado local, trámites documentarios y arreglo floral clásico.',
    precio: 2700.0,
    items: [
      { itemTipo: 'PRODUCTO', codigo: 'ATD-001', cantidad: 1 },
      { itemTipo: 'PRODUCTO', codigo: 'FLO-001', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-001', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-005', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-008', cantidad: 1 },
    ],
  },
  {
    codigo: 'PLN-003',
    nombre: 'Plan Premium',
    descripcion:
      'Ataúd de lujo, velatorio de 48 horas, traslado local, trámites, arreglo floral premium y servicio religioso.',
    precio: 5500.0,
    items: [
      { itemTipo: 'PRODUCTO', codigo: 'ATD-003', cantidad: 1 },
      { itemTipo: 'PRODUCTO', codigo: 'FLO-002', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-002', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-005', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-008', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-009', cantidad: 1 },
    ],
  },
  {
    codigo: 'PLN-004',
    nombre: 'Plan Cremación',
    descripcion: 'Urna metálica, servicio de cremación, velatorio de 24 horas y trámites documentarios.',
    precio: 3000.0,
    items: [
      { itemTipo: 'PRODUCTO', codigo: 'URN-002', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-003', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-001', cantidad: 1 },
      { itemTipo: 'SERVICIO', codigo: 'SRV-008', cantidad: 1 },
    ],
  },
] as const;

const PAYMENT_METHODS = [
  { codigo: 'EFECTIVO', nombre: 'Efectivo', esEfectivo: true },
  { codigo: 'TRANSFERENCIA', nombre: 'Transferencia bancaria', esEfectivo: false },
  { codigo: 'POS', nombre: 'POS / Tarjeta', esEfectivo: false },
  { codigo: 'YAPE', nombre: 'Yape', esEfectivo: false },
  { codigo: 'PLIN', nombre: 'Plin', esEfectivo: false },
  { codigo: 'OTROS', nombre: 'Otros', esEfectivo: false },
] as const;

interface UbigeoData {
  departamentos: { codigo: string; nombre: string }[];
  provincias: { codigo: string; nombre: string; departamentoCodigo: string }[];
  distritos: { codigo: string; nombre: string; provinciaCodigo: string }[];
}

/**
 * Catálogo de ubigeo del Perú (ADR-019). Fuente: jmcastagnetto/ubigeo-peru-aumentado
 * (MIT, metodología INEI/RENIEC), procesado a `prisma/data/ubigeo.json` — 25
 * departamentos, 196 provincias, 1892 distritos (coincide con la cifra
 * vigente de INEI). `createMany` en vez de `upsert` uno-por-uno: es catálogo
 * de referencia puro que solo necesita existir, no actualizarse fila a fila.
 */
async function seedUbigeo(): Promise<void> {
  const existing = await prisma.departamento.count();
  if (existing > 0) return;

  const raw = fs.readFileSync(path.join(__dirname, 'data', 'ubigeo.json'), 'utf8');
  const data = JSON.parse(raw) as UbigeoData;

  await prisma.departamento.createMany({
    data: data.departamentos.map((d) => ({ codigo: d.codigo, nombre: d.nombre })),
    skipDuplicates: true,
  });
  const departamentos = await prisma.departamento.findMany({ select: { id: true, codigo: true } });
  const departamentoIdByCodigo = new Map(departamentos.map((d) => [d.codigo, d.id]));

  await prisma.provincia.createMany({
    data: data.provincias
      .map((p) => {
        const departamentoId = departamentoIdByCodigo.get(p.departamentoCodigo);
        if (!departamentoId) return null;
        return { codigo: p.codigo, nombre: p.nombre, departamentoId };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null),
    skipDuplicates: true,
  });
  const provincias = await prisma.provincia.findMany({ select: { id: true, codigo: true } });
  const provinciaIdByCodigo = new Map(provincias.map((p) => [p.codigo, p.id]));

  await prisma.distrito.createMany({
    data: data.distritos
      .map((d) => {
        const provinciaId = provinciaIdByCodigo.get(d.provinciaCodigo);
        if (!provinciaId) return null;
        return { codigo: d.codigo, nombre: d.nombre, provinciaId };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null),
    skipDuplicates: true,
  });

  console.log(
    `  Ubigeo: ${departamentos.length} departamentos, ${provincias.length} provincias, ${data.distritos.length} distritos.`,
  );
}

async function main() {
  await seedUbigeo();

  await prisma.companyConfig.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      razonSocial: process.env.SEED_EMPRESA_RAZON_SOCIAL ?? 'Funeraria Minaya S.A.C.',
      nombreComercial: 'Funeraria Minaya',
      ruc: process.env.SEED_EMPRESA_RUC ?? '20000000001',
      igvPorcentaje: 18.0,
      moneda: 'PEN',
      comprasDescentralizadas: false,
    },
  });

  const sedePrincipal = await prisma.branch.upsert({
    where: { codigo: 'PRIN' },
    update: {},
    create: {
      codigo: 'PRIN',
      nombre: 'Sede Principal',
      isActive: true,
      isMain: true,
    },
  });

  for (const categoria of PRODUCT_CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria,
    });
  }
  const categorias = await prisma.productCategory.findMany();
  const categoriaByNombre = new Map(categorias.map((c) => [c.nombre, c]));

  for (const producto of PRODUCTS) {
    const categoria = categoriaByNombre.get(producto.categoria);
    if (!categoria) continue;
    await prisma.product.upsert({
      where: { codigo: producto.codigo },
      update: {},
      create: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoriaProductoId: categoria.id,
        unidadMedida: producto.unidadMedida,
        precioVenta: producto.precioVenta,
      },
    });
  }
  const productos = await prisma.product.findMany();
  const productoByCodigo = new Map(productos.map((p) => [p.codigo, p]));

  // Stock inicial centralizado en sede principal (comprasDescentralizadas=false);
  // otras sedes reciben stock por transferencia, no por seed.
  for (const producto of PRODUCTS) {
    const productoRow = productoByCodigo.get(producto.codigo);
    if (!productoRow) continue;
    await prisma.inventory.upsert({
      where: { sedeId_productoId: { sedeId: sedePrincipal.id, productoId: productoRow.id } },
      update: {},
      create: {
        sedeId: sedePrincipal.id,
        productoId: productoRow.id,
        stockActual: producto.stockInicial,
        stockMinimo: producto.stockMinimo,
        costoPromedio: Math.round(producto.precioVenta * 0.6 * 100) / 100,
      },
    });
  }

  for (const servicio of SERVICES) {
    await prisma.service.upsert({
      where: { codigo: servicio.codigo },
      update: {},
      create: { codigo: servicio.codigo, nombre: servicio.nombre, precioBase: servicio.precioBase },
    });
  }
  const servicios = await prisma.service.findMany();
  const servicioByCodigo = new Map(servicios.map((s) => [s.codigo, s]));

  for (const plan of PLANS) {
    const planRow = await prisma.plan.upsert({
      where: { codigo: plan.codigo },
      update: {},
      create: {
        codigo: plan.codigo,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio: plan.precio,
      },
    });
    const existingItems = await prisma.planItem.count({ where: { planId: planRow.id } });
    if (existingItems > 0) continue;
    for (const item of plan.items) {
      const productoRow = item.itemTipo === 'PRODUCTO' ? productoByCodigo.get(item.codigo) : undefined;
      const servicioRow = item.itemTipo === 'SERVICIO' ? servicioByCodigo.get(item.codigo) : undefined;
      await prisma.planItem.create({
        data: {
          planId: planRow.id,
          itemTipo: item.itemTipo,
          productoId: productoRow?.id,
          servicioId: servicioRow?.id,
          cantidad: item.cantidad,
        },
      });
    }
  }

  for (const rol of ROLES) {
    await prisma.role.upsert({
      where: { codigo: rol.codigo },
      update: {},
      create: { codigo: rol.codigo, nombre: rol.nombre },
    });
  }

  for (const permiso of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { codigo: permiso.codigo },
      update: {},
      create: permiso,
    });
  }

  const roles = await prisma.role.findMany();
  const permisos = await prisma.permission.findMany();
  const roleByCodigo = new Map(roles.map((r) => [r.codigo, r]));
  const permisoByCodigo = new Map(permisos.map((p) => [p.codigo, p]));

  for (const rol of ROLES) {
    const rolRow = roleByCodigo.get(rol.codigo);
    if (!rolRow) continue;
    for (const permisoCodigo of ROLE_PERMISSIONS[rol.codigo]) {
      const permisoRow = permisoByCodigo.get(permisoCodigo);
      if (!permisoRow) continue;
      await prisma.rolePermission.upsert({
        where: { rolId_permisoId: { rolId: rolRow.id, permisoId: permisoRow.id } },
        update: {},
        create: { rolId: rolRow.id, permisoId: permisoRow.id },
      });
    }
  }

  const rolAdminCorporativo = roleByCodigo.get('admin_corporativo')!;

  for (const metodo of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { codigo: metodo.codigo },
      update: {},
      create: metodo,
    });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { correo: process.env.SEED_ADMIN_EMAIL ?? 'admin@funerariaminaya.pe' },
    update: { passwordHash },
    create: {
      nombres: 'Administrador',
      apellidos: 'Sistema',
      correo: process.env.SEED_ADMIN_EMAIL ?? 'admin@funerariaminaya.pe',
      usuario: process.env.SEED_ADMIN_USER ?? 'admin',
      passwordHash,
      esCorporativo: true,
      mustChangePassword: true,
    },
  });

  await prisma.userRole.upsert({
    where: { usuarioId_rolId: { usuarioId: adminUser.id, rolId: rolAdminCorporativo.id } },
    update: {},
    create: { usuarioId: adminUser.id, rolId: rolAdminCorporativo.id },
  });

  console.log('Seed completado.');
  console.log(`  Sede principal: ${sedePrincipal.codigo} — ${sedePrincipal.nombre}`);
  console.log(`  Catálogo: ${PRODUCTS.length} productos, ${SERVICES.length} servicios, ${PLANS.length} planes.`);
  console.log(`  Usuario admin: ${adminUser.usuario} (${adminUser.correo})`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(
      `  Password inicial (cámbiala): ${adminPassword} — define SEED_ADMIN_PASSWORD en .env para fijar otra.`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
