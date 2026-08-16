import 'dotenv/config';
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

const PAYMENT_METHODS = [
  { codigo: 'EFECTIVO', nombre: 'Efectivo', esEfectivo: true },
  { codigo: 'TRANSFERENCIA', nombre: 'Transferencia bancaria', esEfectivo: false },
  { codigo: 'POS', nombre: 'POS / Tarjeta', esEfectivo: false },
  { codigo: 'YAPE', nombre: 'Yape', esEfectivo: false },
  { codigo: 'PLIN', nombre: 'Plin', esEfectivo: false },
  { codigo: 'OTROS', nombre: 'Otros', esEfectivo: false },
] as const;

async function main() {
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
