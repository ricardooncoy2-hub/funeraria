# CLAUDE.md — Guía para Claude Code · Sistema Funeraria Minaya

Este archivo define cómo trabajar en este repositorio. Léelo al inicio de cada sesión.

## 0. Fuente de verdad

- La carpeta **`/docs`** es la especificación oficial y **fuente de verdad**. Ante cualquier duda de modelo, reglas o arquitectura, consúltala antes de codificar.
- Empieza por `docs/00_indice.md`. Documentos clave: `10_modelo_datos.md`, `34_decisiones_arquitectonicas.md`, `36_criterios_aceptacion.md`.
- **No** cambies decisiones de arquitectura sin registrar un **ADR** nuevo en `docs/34_decisiones_arquitectonicas.md`. Si algo no está especificado, propón y documenta antes de asumir.

## 1. Los tres pilares (NO negociables)

1. **Sede de venta ≠ sede de cobro** — `ventas.sede_venta_id` vs `pagos.sede_cobro_id`. El dinero de una venta provincial puede caer en cuentas de la sede principal.
2. **Venta ≠ Financiamiento ≠ Pago** — tres entidades distintas. Un pago se aplica a un **financiamiento**, no directo a la venta. Σ `financiamientos.monto` = `ventas.total`.
3. **Financiadores ≠ métodos de pago** — SIS, EsSalud y aseguradoras son **financiadores/coberturas** que generan cuentas por cobrar; **nunca** métodos de pago.

Si una tarea parece violar un pilar, **detente y pregunta**.

## 2. Stack (fijo)

- **Backend:** NestJS + TypeScript (monolito modular). ORM **Prisma** (datasource `provider = "mysql"` + adapter `@prisma/adapter-mariadb`). BD **MariaDB 11.8 LTS** (InnoDB, utf8mb4).
- **Frontends:** Next.js + React + TypeScript + Tailwind. Dos apps: público (SSG/ISR, SEO) y admin (SPA autenticada).
- **Monorepo** con **pnpm** (workspaces). **No usar npm ni yarn.**
- Despliegue servidor: Docker Compose + Nginx + Cloudflare. Storage S3-compatible. Redis **opcional** (no introducir sin justificación).
- **No** hacer: microservicios, Kubernetes, base de datos por sede.

## 3. Entornos (importante)

- **Desarrollo local = Windows SIN Docker.** MariaDB 11.8 y Node LTS **nativos**. Levantar con `pnpm dev`, migraciones con `pnpm prisma migrate dev`.
- **Docker es solo para servidor** (staging/producción). Existe `docker-compose.yml` en el repo, pero **no lo uses para desarrollo local** ni sugieras `docker compose` en instrucciones de dev.
- **Paridad dev/prod:** usar las mismas versiones mayores (MariaDB 11.8 LTS, Node LTS) en local y en las imágenes.
- Detalle: `docs/26_infraestructura.md` §26.10–26.11.

## 4. Comandos (pnpm)

```bash
pnpm install                 # instalar (usa pnpm-lock.yaml)
pnpm dev                     # levantar apps en local
pnpm prisma migrate dev      # migración en desarrollo
pnpm prisma db seed          # datos base
pnpm test / test:unit / test:integration
pnpm lint && pnpm typecheck  # calidad
pnpm build                   # build de las apps
```
En CI y Docker: `corepack enable` + `pnpm install --frozen-lockfile`.

## 5. Reglas de código y datos

- **Nomenclatura de BD obligatoria** (`docs/11_convencion_base_datos.md`): tablas snake_case, plural, **sin tildes ni ñ**. En Prisma usar `@map`/`@@map` para conciliar nombres idiomáticos con la BD. Collation `utf8mb4_uca1400_ai_ci` o `utf8mb4_general_ci` (no `utf8mb4_0900_ai_ci`, que es de MySQL 8).
- **Soft delete** y **anulación** con trazabilidad. **Nunca borrado físico** de datos históricos. FKs por defecto `ON DELETE RESTRICT`.
- Operaciones críticas (venta, pago, transferencia, caja, ajustes) van en **transacción** (`prisma.$transaction`) y usan `SELECT ... FOR UPDATE` sobre `inventarios` cuando afectan stock.
- **Alcance de sede en TODO:** cada consulta/operación valida `sede_id ∈ sedes autorizadas` en el backend. Nunca confiar en el `sede_id` que envía el cliente. El `SedeScopeGuard` es la base del aislamiento multi-sede.
- Montos `DECIMAL(12,2)`, cantidades `DECIMAL(12,3)`. IGV configurable, afectación por ítem.

## 6. Forma de trabajar (flujo esperado)

1. Trabaja **fase por fase** según `docs/33_roadmap.md`. No intentes implementar todo de una vez.
2. Para cada módulo: **primero los tests** de sus criterios de aceptación (`docs/36_criterios_aceptacion.md`), luego el código que los cumple.
3. Respeta la **Definition of Done** del §36.5: cumple RF, respeta RB, pasa CA con tests, valida autorización por rol y sede, registra auditoría, documenta OpenAPI, es transaccional y sin borrado físico.
4. Los **14 casos críticos** (`docs/29_testing.md`) son la red de seguridad de los tres pilares: no los rompas.
5. Incrementos pequeños y verificables. Al terminar, corre `lint`, `typecheck` y `test`.

## 7. Orden de arranque recomendado

**Fase 0 (fundaciones)** antes que cualquier funcionalidad: monorepo + pnpm workspaces, tooling (ESLint/Prettier/TS), esquema Prisma inicial + primera migración + seed (empresa, sede principal, roles/permisos, métodos de pago), esqueleto NestJS con `/api/v1/health`, CI mínimo. Debe compilar y responder health antes de seguir.

Luego **Fase 1** empezando por `auth` + `authz` (RBAC + `SedeScopeGuard`), porque todo el aislamiento multi-sede se apoya en ese guard.

## 8. Frontend

- Sigue `docs/15_frontend.md`. Si existe un **skill de diseño** para el frontend, aplícalo en las fases de UI (admin en Fase 6, público en Fase 7).
- Si el skill de diseño y el `docs/15` difieren en tokens, tipografía o componentes, **no adivines**: unifícalos actualizando `docs/15` (o registrando la diferencia) para evitar dos fuentes de verdad.

## 9. Seguridad y datos personales

- JWT de acceso corto + refresh rotativo hasheado; contraseñas con argon2id/bcrypt; cookies httpOnly; Helmet; rate limit en login y endpoints públicos. Ver `docs/16_seguridad.md`.
- Cumplimiento Ley N.° 29733 (`docs/17_proteccion_datos.md`): consentimiento en formularios públicos, minimización, auditoría de accesos. No loguear secretos ni datos personales innecesarios.

## 10. Qué hacer ante ambigüedad

Pregunta o propón un ADR. No introduzcas dependencias pesadas, patrones distribuidos, ni cambios de stack por iniciativa propia. La simplicidad adecuada a una PYME es un objetivo explícito del proyecto.
