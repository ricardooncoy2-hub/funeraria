# 05 — Requisitos No Funcionales

## 5.1 Performance

- **RNF-001** Los endpoints de lectura frecuentes (listados con paginación) deben responder en **< 400 ms p95** bajo carga esperada de PYME.
- **RNF-002** Las operaciones transaccionales (venta, transferencia, pago) deben completar en **< 1.5 s p95**.
- **RNF-003** El sitio público debe alcanzar **LCP < 2.5 s** y **CLS < 0.1** en móvil (Core Web Vitals). Ver [32](32_seo.md).
- **RNF-004** Los listados deben paginarse; el tamaño de página por defecto es 20, máximo 100.

## 5.2 Disponibilidad

- **RNF-010** Disponibilidad objetivo del backend/admin: **99% mensual** (adecuado para PYME sobre un VPS).
- **RNF-011** El sitio público, servido tras Cloudflare, debe tolerar picos y ataques básicos (WAF/DDoS).
- **RNF-012** Health checks para API y MariaDB; reinicio automático de contenedores caídos (Docker restart policy).

## 5.3 Escalabilidad

- **RNF-020** Diseño inicial para **4 vCPU / 8 GB RAM / 80–160 GB SSD**.
- **RNF-021** Componentes escalables **verticalmente**: MariaDB (más RAM/CPU), VPS.
- **RNF-022** Componentes escalables **horizontalmente** a futuro: instancias de API NestJS (stateless) tras Nginx; Next.js público (cacheable/CDN). Ver [26](26_infraestructura.md).
- **RNF-023** El sistema no debe asumir estado en memoria del proceso API para autorización (todo deriva del token y BD), habilitando múltiples réplicas.

## 5.4 Seguridad

- **RNF-030** Autenticación JWT + refresh; contraseñas con hash fuerte.
- **RNF-031** Autorización por rol y por sede validada en backend.
- **RNF-032** Protección contra SQLi (Prisma parametrizado), XSS (escape en frontend), CSRF donde aplique, y cabeceras de seguridad (Helmet).
- **RNF-033** HTTPS obligatorio en todos los dominios (TLS en Nginx/Cloudflare).
- **RNF-034** Rate limiting en endpoints públicos y de autenticación.
- **RNF-035** Secretos gestionados fuera del código (variables de entorno / gestor de secretos). Detalle en [16](16_seguridad.md).

## 5.5 Mantenibilidad

- **RNF-040** Arquitectura **monolito modular** con separación clara por dominio (ver [13](13_modulos_backend.md)).
- **RNF-041** Código en TypeScript en backend y frontend; linters y formateo (ESLint + Prettier).
- **RNF-042** Cobertura de pruebas mínima en dominios críticos: inventario, transferencias, ventas, pagos, financiamiento, caja, autorización (ver [29](29_testing.md)).
- **RNF-043** Migraciones de BD versionadas con Prisma Migrate.
- **RNF-044** Convención de nomenclatura de BD obligatoria (ver [11](11_convencion_base_datos.md)).

## 5.6 Auditabilidad y trazabilidad

- **RNF-050** Toda operación crítica deja registro en `auditoria` y/o movimientos específicos.
- **RNF-051** No se eliminan físicamente transacciones críticas (soft delete + anulación).
- **RNF-052** El kardex debe ser reconstruible desde `movimientos_inventario`.

## 5.7 Usabilidad y accesibilidad

- **RNF-060** El admin debe ser responsive y usable en tablets.
- **RNF-061** El sitio público debe cumplir **WCAG 2.1 nivel AA** en aspectos esenciales (contraste, foco, navegación por teclado, textos alternativos).
- **RNF-062** Idioma: español (Perú). Formatos de fecha `DD/MM/AAAA` y moneda `S/ #,##0.00`.

## 5.8 Compatibilidad

- **RNF-070** Navegadores objetivo: últimas 2 versiones de Chrome, Edge, Firefox, Safari.
- **RNF-071** El sitio público debe funcionar correctamente en móviles de gama media.

## 5.9 Recuperación ante fallos

- **RNF-080** Backups automáticos de MariaDB con retención definida (ver [30](30_backups.md)).
- **RNF-081** RPO ≤ 24 h (backup diario) y objetivo de RPO ≤ 1 h con binlog/incremental si el negocio lo requiere.
- **RNF-082** RTO ≤ 4 h para restauración completa en el mismo VPS.
- **RNF-083** Procedimiento documentado y **probado** de restauración.

## 5.10 Cumplimiento

- **RNF-090** Cumplimiento de **Ley N.° 29733** y su reglamento (protección de datos, Perú). Ver [17](17_proteccion_datos.md).
- **RNF-091** Registro de consentimiento en formularios públicos que capten datos personales.
- **RNF-092** Política de retención y eliminación de datos documentada.

## 5.11 Observabilidad

- **RNF-100** Logs estructurados (JSON) con correlación por request id.
- **RNF-101** Métricas básicas de CPU, memoria, disco, MariaDB y API.
- **RNF-102** Alertas mínimas ante caídas de servicio y stock crítico. Ver [31](31_observabilidad.md).

## 5.12 Costos operativos

- **RNF-110** El diseño debe minimizar costos: un VPS, Docker Compose, sin licencias propietarias obligatorias, sin orquestadores. Redis solo si se justifica.
