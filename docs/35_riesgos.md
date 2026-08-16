# 35 — Riesgos

Matriz de riesgos con probabilidad (P), impacto (I) y mitigación. Escala: Baja/Media/Alta.

| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| RG-01 | Inconsistencia de stock por concurrencia (dos ventas simultáneas) | Media | Alta | Transacciones + `SELECT ... FOR UPDATE` sobre `inventarios`; tests de concurrencia (RB-025) |
| RG-02 | Confusión venta/cobro genera reportes erróneos | Media | Alta | Modelo explícito `sede_venta_id`/`sede_cobro_id`; reportes separados; CA-PAY-03 |
| RG-03 | Tratar SIS/aseguradoras como método de pago | Media | Alta | `financiadores` separados; validación de dominio; CA-FIN-02 |
| RG-04 | Fuga de datos entre sedes (usuario ve otra sede) | Media | Alta | `SedeScopeGuard` central; nunca confiar en el cliente; tests CA-SEC-01 |
| RG-05 | Pérdida de datos por fallo del VPS | Baja | Alta | Backups cifrados fuera del VPS + prueba de restore (RTO/RPO) |
| RG-06 | Migración destructiva rompe producción | Media | Alta | Estrategia expand/contract; `migrate deploy`; rollback por imagen; nunca `reset` |
| RG-07 | Vulnerabilidades de seguridad (XSS/SQLi/tokens) | Media | Alta | Prisma parametrizado, Helmet, validación DTO, cookies httpOnly, rate limit, revisiones |
| RG-08 | Sobrecarga del único VPS al crecer | Media | Media | Escalado vertical primero; API stateless para réplicas; réplica de lectura MariaDB a futuro |
| RG-09 | Incumplimiento Ley 29733 | Media | Alta | Consentimiento, minimización, retención, ARCO, auditoría (ver [17](17_proteccion_datos.md)) |
| RG-10 | Alcance creciente (scope creep) hacia ERP/contabilidad | Alta | Media | Alcance v1 acotado ([02](02_alcance.md)); nuevas necesidades → ADR antes de implementar |
| RG-11 | Correlativos/documentos duplicados por carrera | Baja | Media | Generación de correlativos dentro de transacción; unicidad en BD |
| RG-12 | Diferencias de caja no controladas | Media | Media | Arqueo obligatorio con diferencia registrada y auditada; permisos de cierre |
| RG-13 | Pérdida de trazabilidad por borrado físico | Baja | Alta | Soft delete + anulación; FKs `ON DELETE RESTRICT`; auditoría append-only |
| RG-14 | Dependencia de un solo desarrollador / conocimiento | Media | Media | Esta documentación como fuente de verdad; ADRs; código y migraciones versionados |
| RG-15 | Conectividad intermitente en sedes provinciales | Media | Media | Sistema web centralizado; operaciones idempotentes; reintentos en el cliente; (offline fuera de v1) |
| RG-16 | Integración futura con facturación electrónica SUNAT | Media | Media | Diseño extensible (campos de comprobante previstos); no bloquear v1 |
| RG-17 | Costos de S3/almacenamiento crecientes | Baja | Baja | Políticas de retención de archivos; no guardar binarios en la base de datos |
| RG-18 | Errores de cálculo de IGV/afectación | Media | Media | Afectación por ítem; pruebas de cálculo (RC-002/003); configuración de IGV |
| RG-19 | Anulaciones mal gestionadas con pagos existentes | Media | Alta | Política explícita de devolución/bloqueo (RB-028); auditoría; tests CA-SALE-03 |
| RG-20 | Exposición accidental del admin a indexación/ataques | Baja | Media | `noindex`, robots bloquea `app`, WAF Cloudflare, rate limit login |

## 35.1 Riesgos priorizados (alto impacto)

1. **RG-01/RG-04/RG-13** — integridad y aislamiento de datos: son el corazón del sistema; se mitigan con transacciones, guards y soft delete, y se cubren con tests obligatorios.
2. **RG-02/RG-03** — modelado correcto del dinero y financiadores: mitigado por ADR-009/010/012.
3. **RG-05/RG-06/RG-09** — operación y cumplimiento: backups probados, migraciones seguras y protección de datos.

## 35.2 Gestión

- Revisar la matriz al inicio de cada fase del roadmap.
- Todo riesgo nuevo o decisión no prevista se documenta como ADR y, si aplica, se añade aquí.
