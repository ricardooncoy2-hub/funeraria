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

  const permisoAccesoTotal = await prisma.permission.upsert({
    where: { codigo: 'sede.acceso_total' },
    update: {},
    create: {
      codigo: 'sede.acceso_total',
      nombre: 'Acceso a todas las sedes',
      modulo: 'authz',
    },
  });

  const rolAdminCorporativo = await prisma.role.findUniqueOrThrow({
    where: { codigo: 'admin_corporativo' },
  });

  await prisma.rolePermission.upsert({
    where: {
      rolId_permisoId: { rolId: rolAdminCorporativo.id, permisoId: permisoAccesoTotal.id },
    },
    update: {},
    create: { rolId: rolAdminCorporativo.id, permisoId: permisoAccesoTotal.id },
  });

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
