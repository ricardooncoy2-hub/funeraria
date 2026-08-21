# 34 — Decisiones Arquitectónicas (ADR)

Formato: contexto/problema, alternativas, decisión, justificación, consecuencias.

---

## ADR-001 — Monolito modular (no microservicios)
- **Problema:** ¿cómo estructurar el backend?
- **Alternativas:** (a) microservicios; (b) monolito clásico; (c) **monolito modular**.
- **Decisión:** monolito modular en NestJS.
- **Justificación:** una PYME con un equipo pequeño no obtiene beneficio de microservicios (complejidad operativa, despliegue, consistencia distribuida) y sí sus costos. El monolito modular da límites de dominio claros y transacciones ACID locales.
- **Consecuencias:** un solo despliegue; escalar por réplicas stateless; si algún módulo creciera mucho, podría extraerse a futuro.

## ADR-002 — MariaDB como RDBMS
- **Problema:** motor de base de datos.
- **Alternativas:** MariaDB, MySQL 8, PostgreSQL, otros.
- **Decisión:** **MariaDB 11.8 LTS** (motor InnoDB). Se accede vía Prisma con el datasource `provider = "mysql"` y el driver adapter `@prisma/adapter-mariadb`.
- **Justificación (motivos reales del proyecto):**
  1. **Independencia/gobernanza:** el servidor community de MariaDB es 100% open source (GPLv2) y su núcleo lo mantiene la MariaDB Foundation, evitando la dependencia de Oracle. *Matiz honesto:* la empresa MariaDB plc fue adquirida por un fondo de private equity (K1, 2024); lo que consumimos es el servidor community abierto, no el producto comercial.
  2. **Esfuerzo de migración mínimo (en fase de diseño):** el proyecto aún no tiene código, por lo que el coste de cambio es prácticamente cero. La compatibilidad "sin cambios" en tiempo de ejecución la garantiza **Prisma**, que abstrae las diferencias; **no** es un drop-in binario de MySQL 8 (ambos han divergido: JSON, plugins de autenticación, tablas de sistema).
  3. **Soporte de hosting:** ampliamente soportado en VPS y nubes (AWS RDS, DigitalOcean, Railway) y motor por defecto en muchas distribuciones Linux.
  4. **Soporte a largo plazo:** **11.8 es la LTS más reciente (2025)**, la que recibe desarrollo y parches más activos, con ~5 años de mantenimiento community (aprox. hasta 2030; confirmar la fecha exacta de EOL antes de fijar en producción). Es la sucesora de 11.4 LTS. Las líneas LTS anteriores (11.4 hasta ~2029, 10.11 hasta 2028) quedan como respaldo si el hosting aún no ofrece 11.8; **10.6 se descarta** (EOL julio 2026). No usar versiones *rolling* (11.5–11.7, 12.0–12.2): tienen solo 1–2 años de soporte pese al número más alto.
- **No se decidió por:** rendimiento (irrelevante a la escala de una PYME; benchmarks mixtos entre ambos) ni por features avanzadas de MariaDB (tablas *system-versioned* para auditoría, búsqueda vectorial): existen, pero **Prisma no las modela** y quedarían como SQL crudo fuera del esquema; además la auditoría del sistema ya se resuelve con la tabla `auditoria` append-only (ver [25](25_auditoria.md)). No forman parte del alcance v1.
- **Consecuencias:**
  - Prisma: `provider = "mysql"` + `@prisma/adapter-mariadb` (soporte de primera clase, con arreglos activos específicos de MariaDB).
  - Charset `utf8mb4`; en 11.8 utf8mb4 es el **charset por defecto** y las collations UCA 14.0.0 están disponibles: usar `utf8mb4_uca1400_ai_ci` (o `utf8mb4_general_ci`). No usar `utf8mb4_0900_ai_ci` (es exclusiva de MySQL 8).
  - JSON: en MariaDB es internamente `LONGTEXT` con `CHECK (json_valid(col))`; suficiente para `auditoria.datos` (no se hace indexación JSON intensiva). 11.8 añade mejoras de JSON Path.
  - **Año 2038:** 11.8 extiende el rango de `TIMESTAMP` más allá de 2038, sin conversión de datos (salvo si se usaran system-versioned tables, que no es el caso). Aun así, el modelo usa `DATETIME` para fechas de negocio.
  - `CHECK` y **columnas generadas** para unicidad parcial (sede principal, caja abierta) están soportadas (CHECK desde MariaDB 10.2).
  - **Paridad total:** MariaDB 11.8 idéntica en dev local (nativo, Windows), CI y servidor (imagen `mariadb:11.8`). Verificar que el hosting ofrezca 11.8; si no, usar 11.4 LTS como respaldo inmediato.

## ADR-003 — Prisma como ORM
- **Problema:** acceso a datos y migraciones.
- **Alternativas:** Prisma, TypeORM, Knex/SQL crudo.
- **Decisión:** Prisma (datasource `mysql` + `@prisma/adapter-mariadb` para MariaDB).
- **Justificación:** tipado fuerte con TypeScript, migraciones declarativas, `@map`/`@@map` para conciliar nombres idiomáticos (TS) con la nomenclatura snake_case obligatoria en la base de datos, y `$transaction` para operaciones críticas. Prisma es además la capa que hace que el cambio MySQL→MariaDB sea de bajo impacto.
- **Consecuencias:** modelos en TS con mapeo explícito; consultas complejas de reportes pueden usar `queryRaw` parametrizado cuando convenga. Si en el futuro se quisieran features exclusivas de MariaDB (temporal tables, vectores), se implementarían con SQL crudo/migraciones manuales, no desde el esquema Prisma.

## ADR-004 — Next.js + React + TypeScript + Tailwind (frontends)
- **Problema:** tecnología de los frontends público y admin.
- **Decisión:** Next.js (App Router) para ambos.
- **Justificación:** SSG/ISR para SEO/performance del sitio público; SPA/SSR para el admin; ecosistema y productividad. Tailwind para UI consistente y rápida.
- **Consecuencias:** dos apps lógicamente separadas que comparten cliente de API y tipos.

## ADR-005 — NestJS + TypeScript (backend)
- **Decisión:** NestJS.
- **Justificación:** estructura modular, inyección de dependencias, guards/interceptores/pipes ideales para RBAC + alcance de sede + auditoría transversal; genera OpenAPI.
- **Consecuencias:** convención de módulos por dominio (ver [13](13_modulos_backend.md)).

## ADR-006 — Arquitectura multi-sede en base única con `sede_id`
- **Problema:** cómo aislar datos por sede.
- **Alternativas:** (a) base por sede; (b) esquema por sede; (c) **columna `sede_id` + autorización en backend**.
- **Decisión:** (c).
- **Justificación:** una base única facilita catálogos maestros, reportes consolidados y mantenimiento; agregar sede = insertar fila. Bases/esquemas por sede multiplican operación, migraciones y backups sin beneficio para una PYME.
- **Consecuencias:** todo filtro operativo valida `sede_id ∈ sedes_autorizadas`; disciplina obligatoria en cada query (guard central).

## ADR-007 — Compras centralizadas en sede principal
- **Decisión:** las compras se registran solo para la sede principal (flag para descentralizar a futuro).
- **Justificación:** refleja la operación real; simplifica costos y control.
- **Consecuencias:** distribución vía transferencias; `compras.sede_id = principal`.

## ADR-008 — Inventario por sede (`inventarios` con `UNIQUE(sede_id, producto_id)`)
- **Decisión:** stock por sede, no `productos.stock`.
- **Justificación:** el mismo producto tiene stock distinto por sede; el global es derivado.
- **Consecuencias:** movimientos por sede; kardex reconstruible; costo promedio por sede.

## ADR-009 — Separación sede de venta / sede de cobro
- **Decisión:** `ventas.sede_venta_id` y `pagos.sede_cobro_id` independientes; `destinos_pago.sede_administradora_id`.
- **Justificación:** el dinero de una venta provincial puede caer en cuentas de la principal (transferencia/POS).
- **Consecuencias:** reportes de ventas por sede ≠ reportes de cobros/efectivo por sede; ninguna restricción los iguala.

## ADR-010 — Separación venta / financiamiento / pago
- **Decisión:** tres entidades: `ventas`, `financiamientos`, `pagos` (pago aplicado a un financiamiento).
- **Justificación:** una venta puede tener varios financiadores y varios pagos; quién asume el costo ≠ dinero recibido.
- **Consecuencias:** Σ financiamientos = total; saldo pendiente y CxC derivados de financiamientos − pagos.

## ADR-011 — Caja exclusivamente para control de efectivo
- **Decisión:** la caja registra solo efectivo; los pagos electrónicos no generan movimiento de caja física.
- **Justificación:** evita convertir la caja en un sistema bancario; deja los electrónicos listos para conciliación.
- **Consecuencias:** validación método↔destino; arqueo solo sobre efectivo.

## ADR-012 — Financiadores separados de métodos de pago
- **Decisión:** `financiadores` (cliente, SIS, EsSalud, aseguradoras...) ≠ `metodos_pago` (efectivo, transferencia, POS, Yape, Plin).
- **Justificación:** SIS/EsSalud/aseguradoras son coberturas que generan CxC, no formas de pago.
- **Consecuencias:** modelo de financiamiento y CxC coherente; reportes de financiamiento por institución.

## ADR-013 — Transferencias entre sedes con estados y doble movimiento
- **Decisión:** `transferencias_inventario` con estados; envío = salida en origen, recepción = entrada en destino, transaccional.
- **Justificación:** consistencia y trazabilidad de la distribución.
- **Consecuencias:** consistencia ACID; concepto de "en tránsito" entre envío y recepción.

---

## ADR-014 — Servicios contratados como entidad separada
- **Decisión:** modelar la operación funeraria en `servicios_contratados` vinculada a la venta (no dentro de `detalle_venta`).
- **Justificación:** separa datos operativos (fecha, lugar, estado, responsable) sin contaminar el modelo de ventas. Ver [20](20_ventas.md).
- **Consecuencias:** una entidad adicional; reportes operativos independientes de los comerciales.

## ADR-015 — Clientes corporativos (compartidos entre sedes)
- **Decisión:** `clientes` es información corporativa, no por sede.
- **Justificación:** evita duplicar y fragmentar el historial; unicidad por documento. Ver [09](09_arquitectura_multi_sede.md) §9.6.
- **Consecuencias:** la visibilidad del historial respeta el alcance de sede del consultante; cada venta conserva su sede.

## ADR-016 — Estructura de repositorio: monorepo
- **Decisión:** monorepo (ver [57 del prompt] y §estructura del proyecto).
- **Justificación:** compartir tipos y cliente de API entre backend y frontends; un solo pipeline; ideal para equipo pequeño y para Claude Code (contexto unificado).
- **Consecuencias:** herramienta de workspaces (pnpm/turborepo); builds selectivos por `paths`.

## ADR-017 — Gestor de paquetes: pnpm
- **Problema:** gestor de dependencias del monorepo.
- **Alternativas:** npm, yarn, **pnpm**.
- **Decisión:** pnpm.
- **Justificación:** workspaces de primera clase, instalación rápida y ahorro de disco por store con enlaces (relevante en Windows), y resolución **estricta** que evita *phantom dependencies* en monorepo. Se fija con `packageManager` en `package.json` y `corepack`.
- **Consecuencias:** `pnpm-workspace.yaml` y `pnpm-lock.yaml` versionados; CI e imágenes Docker usan `pnpm install --frozen-lockfile`.

## ADR-018 — Docker solo en servidor; desarrollo local nativo (Windows)
- **Problema:** Docker Desktop es pesado en Windows para el trabajo diario.
- **Alternativas:** (a) Docker también en local; (b) **servicios nativos en local, Docker solo en servidor**; (c) WSL2 + Docker.
- **Decisión:** (b). El `docker-compose.yml` es artefacto de despliegue (staging/producción); en local se usan MariaDB 11.8 y Node nativos.
- **Justificación:** menor fricción y consumo en Windows sin sacrificar la estrategia de despliegue reproducible en servidor.
- **Consecuencias:** vigilar **paridad dev/prod** fijando versiones mayores idénticas (MariaDB 11.8 LTS, Node LTS) y validando en CI contra MariaDB 11.8. Ver [26](26_infraestructura.md) §26.10–26.11.

## ADR-019 — Catálogo normalizado de ubigeo (departamento/provincia/distrito)
- **Problema:** `sedes` guardaba departamento/provincia/distrito como tres `VARCHAR` libres sin catálogo ni validación (posibles combinaciones inconsistentes, sin IDs internos); `clientes`/`proveedores` solo tenían un campo `direccion` de texto, sin desglose geográfico. Ningún módulo tenía una fuente única reutilizable para pedir ubicación.
- **Alternativas:** (a) mantener texto libre en cada tabla que lo necesite; (b) una sola tabla `ubigeos` desnormalizada (departamento/provincia/distrito como texto + código de 6 dígitos); (c) **catálogo normalizado de 3 tablas** (`departamentos` → `provincias` → `distritos`, jerarquía por FK) sembrado una vez y referenciado por un único `distrito_id`.
- **Decisión:** (c). Toda entidad con dirección (`sedes`, `clientes`, `proveedores`, y las que se agreguen a futuro) guarda **un solo** `distrito_id` (nullable) — departamento y provincia se derivan siempre por la cadena `distrito → provincia → departamento`, nunca se duplican como texto. Expuesto por un módulo NestJS de solo lectura (`GET /ubigeo/departamentos`, `/provincias?departamentoId=`, `/distritos?provinciaId=`, `/distritos/:id`) sin permiso especial (catálogo de referencia, no dato sensible), reutilizado por cualquier servicio que necesite validar un `distritoId` (`UbigeoService.assertDistritoExists`) y por un componente de frontend compartido (`LocationSelect`, 3 selects dependientes con reseteo en cascada).
- **Fuente de datos:** `jmcastagnetto/ubigeo-peru-aumentado` (MIT, metodología INEI/RENIEC + CEPLAN/MINSA/PNUD), procesado a `apps/api/prisma/data/ubigeo.json` y sembrado por `prisma/seed.ts` — 25 departamentos, 196 provincias, 1892 distritos (coincide con la cifra vigente de INEI a 2025). Se descartó 1 fila de origen sin código INEI (solo traía RENIEC) en vez de mezclar esquemas de codificación no equivalentes entre sí.
- **Justificación:** un solo FK hace **físicamente imposible** guardar una combinación departamento/provincia/distrito inconsistente (no se valida después, se elimina la posibilidad de origen); evita duplicar la lógica de validación en cada módulo (`BranchesService`/`CustomersService`/`SuppliersService` reutilizan `UbigeoService`); sigue el patrón de catálogo ya usado en el proyecto (`categorias_producto` → `productos`, con FK real, no texto).
- **Consecuencias:** las tablas `sedes.departamento`/`provincia`/`distrito` (texto) se eliminaron — cualquier reporte o export que las usara debe migrar a resolver el nombre vía la relación `distrito`. El dataset de distritos es una foto de un momento dado del INEI; si se crea un distrito nuevo por ley después de la fecha de este seed, hay que actualizar `ubigeo.json` y re-sembrar (no bloquea creación de sedes/clientes/proveedores sin ubicación, el campo es opcional).

## ADR-020 — MariaDB en un `docker-compose` separado del stack principal
- **Problema:** en el primer despliegue real a un VPS, `mariadb` vivía como un servicio más dentro del `docker-compose.yml` de la raíz. Esto acopla su ciclo de vida al del resto del stack (reconstruir/redeployar `web`/`admin`/`api` puede arrastrar recreaciones no deseadas de la base de datos) y no deja margen para aislarla de red de forma más estricta que "no publicar el puerto al host".
- **Alternativas:** (a) mantener `mariadb` dentro del compose principal, solo sin publicar su puerto (estado previo); (b) **compose separado para MariaDB**, con su propia red `internal: true` (sin ruta a internet ni a otras redes salvo lo que se conecte explícitamente) referenciada como `external: true` desde el compose principal; (c) MariaDB gestionada fuera de Docker (paquete nativo en el VPS).
- **Decisión:** (b). `docker/mariadb/docker-compose.yml` (versionado en el repo, se copia a una carpeta propia del servidor) declara la red `backend` con nombre fijo `funeraria_backend`. El `docker-compose.yml` de la raíz la referencia como `external: true` y conecta *solo* el servicio `api` a ella — `web`/`admin`/`nginx` nunca tienen ruta de red hacia la base de datos.
- **Justificación:** separa el ciclo de vida de un recurso con estado (datos reales de clientes/ventas) del de los servicios sin estado que se reconstruyen en cada release; principio de mínimo privilegio de red (solo `api` puede alcanzar la base de datos, ni siquiera `nginx`); permite que el volumen de datos (bind mount a una ruta del host) sea gestionado/respaldado independientemente de dónde esté clonado el repo del stack principal.
- **Consecuencias:** Compose no puede expresar `depends_on` entre archivos/proyectos distintos — el operador debe garantizar manualmente que el compose de MariaDB esté arriba y sano antes de construir/levantar `api` (documentado en `DEPLOYMENT.md`). Si la red `funeraria_backend` no existe todavía cuando se corre `docker compose build`/`up` del stack principal, Compose falla explícitamente (`network ... declared as external, but could not be found`) en vez de crear una MariaDB nueva por accidente — comportamiento deseado, no un bug.
