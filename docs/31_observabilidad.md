# 31 — Observabilidad

Adecuada a una PYME: útil, no excesiva.

## 31.1 Logs

- **Estructurados en JSON** (backend con `pino`/logger de Nest). Campos: timestamp, nivel, `requestId`, `userId`, `sedeId`, ruta, método, status, latencia, mensaje.
- **Correlación:** `RequestIdInterceptor` asigna `x-request-id`; se propaga en logs y respuestas de error.
- **Niveles:** error, warn, info, debug (debug solo en no-producción).
- **No loguear** secretos, contraseñas, tokens ni datos personales innecesarios (enmascarar).
- Salida a stdout/stderr → recolección por Docker; opcional agregador ligero (Loki/`docker logs` + rotación).

## 31.2 Métricas

- **Aplicación:** exponer `/metrics` (Prometheus) o al menos health con contadores básicos: requests, errores, latencia p95, ventas/pagos por minuto (negocio).
- **Sistema:** CPU, memoria, disco, I/O del VPS (node_exporter o el monitoreo del proveedor).
- **MariaDB:** conexiones, consultas lentas, uso de buffer pool, tamaño de datos.
- Dashboard simple (Grafana opcional) si se justifica; para PYME, incluso alertas por script + correo pueden bastar inicialmente.

## 31.3 Health checks

- `GET /api/v1/health` → estado de la API y verificación de conexión a MariaDB (y Redis/S3 si aplican).
- Healthchecks de Docker por servicio (ver [27](27_docker.md)).
- Cloudflare/monitor externo (UptimeRobot o similar) para disponibilidad de `www`, `app`, `api`.

## 31.4 Alertas mínimas

| Evento | Acción |
|---|---|
| API/MariaDB caídos | Alerta inmediata (correo/mensaje) |
| Disco > 85% | Alerta |
| CPU/RAM sostenidas altas | Alerta |
| Fallo de backup | Alerta (incidente) |
| Stock crítico (negocio) | Notificación al encargado |
| Pico de 401/403/errores 5xx | Alerta de seguridad/estabilidad |

## 31.5 Trazas (opcional/futuro)

- OpenTelemetry puede añadirse si crece la complejidad. No es requisito de v1.

## 31.6 Auditoría vs observabilidad

- **Auditoría** ([25](25_auditoria.md)): eventos de negocio/seguridad persistidos en BD (quién hizo qué).
- **Observabilidad:** salud y rendimiento técnico. Son complementarias y no se mezclan.

## 31.7 Retención de logs

- Rotación local (por tamaño/tiempo) para no llenar el disco.
- Logs de seguridad relevantes que también son de auditoría se persisten en `auditoria`.

## 31.8 Principio

Empezar con lo esencial (logs estructurados + health + alertas de caída y disco) y crecer solo si el volumen o los incidentes lo justifican.
