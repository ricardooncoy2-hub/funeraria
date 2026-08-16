# 03 — Actores

## 3.1 Actores humanos (roles)

Los roles determinan permisos; el **alcance de sede** determina sobre qué sedes se aplican. Un usuario puede tener uno o varios roles y acceso a una o varias sedes (ver [07 relación usuario-sede] y [16](16_seguridad.md)).

| Rol (código) | Nombre | Alcance típico | Responsabilidad principal |
|--------------|--------|----------------|---------------------------|
| `admin_corporativo` | Administrador corporativo | Todas las sedes | Configuración global, catálogos maestros, usuarios/roles, reportes consolidados |
| `admin_sede` | Administrador de sede | 1..N sedes asignadas | Gestión operativa de sus sedes, aprobación de transferencias/anulaciones |
| `vendedor` | Vendedor | Sede(s) asignada(s) | Cotizaciones, ventas, registro de clientes, registro de pagos |
| `encargado_inventario` | Encargado de inventario | Sede(s) asignada(s) | Inventario, recepción de transferencias, ajustes, mermas |
| `encargado_caja` | Encargado de caja | Sede(s) asignada(s) | Apertura/cierre de caja, movimientos de efectivo, arqueo |
| `supervisor` | Supervisor | 1..N sedes | Consulta ampliada, aprobación de operaciones, reportes de sede |
| `consulta` | Consulta (solo lectura) | Sede(s) asignada(s) | Lectura de información autorizada, sin acciones de escritura |

> Un usuario real puede combinar funciones (p. ej. en una sede pequeña el mismo usuario es `vendedor` + `encargado_caja`). Por eso el modelo es **muchos-a-muchos** entre usuario, rol y sede.

## 3.2 Matriz rol → capacidad (resumen)

Detalle fino en [16 — Seguridad, matriz de autorización]. Resumen:

| Capacidad | admin_corp | admin_sede | vendedor | enc_inv | enc_caja | supervisor | consulta |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Configuración global | ✔ | | | | | | |
| Catálogos maestros (crear/editar) | ✔ | leer | leer | leer | leer | leer | leer |
| Usuarios/roles | ✔ | (parcial†) | | | | | |
| Sedes (crear/editar) | ✔ | | | | | | |
| Compras | ✔ | ✔(principal) | | leer | | leer | leer |
| Inventario (ajustes) | ✔ | ✔ | leer | ✔ | | leer | leer |
| Transferencias (solicitar/aprobar/recibir) | ✔ | ✔ | | ✔(recibir) | | ✔(aprobar) | leer |
| Ventas | ✔ | ✔ | ✔ | | | leer | leer |
| Cotizaciones | ✔ | ✔ | ✔ | | | ✔ | leer |
| Financiamiento / CxC | ✔ | ✔ | ✔(registrar) | | | leer | leer |
| Pagos | ✔ | ✔ | ✔ | | ✔(efectivo) | leer | leer |
| Caja | ✔ | ✔ | | | ✔ | leer | leer |
| Reportes de sede | ✔ | ✔ | parcial | parcial | parcial | ✔ | ✔ |
| Reportes consolidados | ✔ | | | | | ✔(si multi-sede) | |
| Auditoría | ✔ | ✔(su sede) | | | | ✔ | |
| Anulaciones | ✔ | ✔ | solicitar | | | ✔ | |

† `admin_sede` puede gestionar usuarios operativos de sus sedes solo si se le concede el permiso `usuarios.gestionar_sede`.

## 3.3 Actores externos (sitio público)

| Actor | Descripción | Interacción |
|-------|-------------|-------------|
| **Visitante anónimo** | Persona que navega el sitio público | Consulta información, servicios, productos, planes, sedes, FAQ |
| **Solicitante de cotización** | Visitante que envía una solicitud | Crea una `cotizacion` con origen `WEB` |
| **Contacto WhatsApp** | Visitante que inicia chat | Redirección a WhatsApp con mensaje prellenado |

## 3.4 Actores de sistema

| Actor | Descripción |
|-------|-------------|
| **Scheduler / cron** | Tareas programadas: backups, cálculo de vencimiento de cotizaciones, alertas de stock bajo, recordatorios de CxC |
| **Servicio de correo** | Envío de confirmaciones de cotización y notificaciones internas |
| **Almacenamiento S3** | Guarda documentos, comprobantes, imágenes de catálogo y coberturas |
| **Cloudflare** | CDN, WAF, protección DDoS del sitio público |

## 3.5 Notas de diseño

- **Ningún actor confía en filtros del frontend para seguridad.** El backend deriva el alcance de sedes del token del usuario y sus asignaciones (`usuario_sede`), no de parámetros arbitrarios (ver RB-018).
- El **visitante anónimo** solo tiene acceso a endpoints públicos de lectura y al endpoint de creación de cotización (con rate limiting y captcha).
