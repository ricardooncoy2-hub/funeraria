# FUNERARIA MINAYA — Documentación Técnica Integral

**Versión:** 1.0
**Estado:** Especificación base (fuente de verdad para implementación)
**Fecha:** 2026
**Ámbito:** Sistema web multi-sede para gestión funeraria (Perú)

> Esta documentación es la **ESPECIFICACIÓN BASE**. Ningún agente de desarrollo (humano o Claude Code) debe inventar reglas de negocio fundamentales: si una decisión no está aquí, debe registrarse como decisión arquitectónica antes de implementarse.

> **Para Claude Code:** el archivo **`CLAUDE.md`** (raíz del repo) resume las reglas de trabajo, el stack, los tres pilares y la distinción de entornos (dev local nativo en Windows vs Docker en servidor). Léelo al inicio de cada sesión; esta carpeta `/docs` es la fuente de verdad detallada.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Resumen ejecutivo](01_resumen_ejecutivo.md) | Visión, objetivo, stack, decisiones clave |
| 02 | [Alcance](02_alcance.md) | Incluido / excluido, supuestos, restricciones |
| 03 | [Actores](03_actores.md) | Roles humanos y de sistema |
| 04 | [Requisitos funcionales](04_requisitos_funcionales.md) | RF por módulo |
| 05 | [Requisitos no funcionales](05_requisitos_no_funcionales.md) | RNF |
| 06 | [Reglas de negocio](06_reglas_negocio.md) | RB-001..RB-030 |
| 07 | [Casos de uso](07_casos_uso.md) | Flujos principales |
| 08 | [Arquitectura](08_arquitectura.md) | Arquitectura general, capas |
| 09 | [Arquitectura multi-sede](09_arquitectura_multi_sede.md) | Modelo corporativo vs sede, scoping |
| 10 | [Modelo de datos](10_modelo_datos.md) | Tablas, columnas, tipos, relaciones |
| 11 | [Convención de base de datos](11_convencion_base_datos.md) | Nomenclatura obligatoria |
| 12 | [ERD](12_erd.md) | Diagrama entidad-relación (Mermaid) |
| 13 | [Módulos backend](13_modulos_backend.md) | Módulos NestJS |
| 14 | [API](14_api.md) | REST API v1 |
| 15 | [Frontend](15_frontend.md) | Sitio público + admin |
| 16 | [Seguridad](16_seguridad.md) | Autenticación, autorización, hardening |
| 17 | [Protección de datos](17_proteccion_datos.md) | Ley N.° 29733 |
| 18 | [Inventario](18_inventario.md) | Inventario multi-sede y kardex |
| 19 | [Compras y transferencias](19_compras_transferencias.md) | Compras centralizadas, transferencias |
| 20 | [Ventas](20_ventas.md) | Ventas y servicios contratados |
| 21 | [Financiamiento](21_financiamiento.md) | Financiadores, coberturas, CxC |
| 22 | [Pagos y cajas](22_pagos_cajas.md) | Pagos, métodos, destinos, caja |
| 23 | [Cotizaciones](23_cotizaciones.md) | Cotizaciones web y presenciales |
| 24 | [Reportes](24_reportes.md) | Reportes por sede y consolidados |
| 25 | [Auditoría](25_auditoria.md) | Trazabilidad de eventos |
| 26 | [Infraestructura](26_infraestructura.md) | VPS, Nginx, Cloudflare |
| 27 | [Docker](27_docker.md) | Contenedores y Compose |
| 28 | [CI/CD](28_ci_cd.md) | Pipelines |
| 29 | [Testing](29_testing.md) | Estrategia y casos críticos |
| 30 | [Backups](30_backups.md) | Respaldos, RPO/RTO |
| 31 | [Observabilidad](31_observabilidad.md) | Logs, métricas, health |
| 32 | [SEO](32_seo.md) | SEO del sitio público |
| 33 | [Roadmap](33_roadmap.md) | Fases de entrega |
| 34 | [Decisiones arquitectónicas](34_decisiones_arquitectonicas.md) | ADR-001..ADR-013 |
| 35 | [Riesgos](35_riesgos.md) | Matriz de riesgos |
| 36 | [Criterios de aceptación](36_criterios_aceptacion.md) | Criterios + checklist de consistencia |

## Cómo leer esta documentación

1. **Negocio primero:** 01 → 02 → 03 → 06 (reglas) → 07 (casos de uso).
2. **Arquitectura:** 08 → 09 → 34 (ADRs).
3. **Datos:** 11 (convención) → 10 (modelo) → 12 (ERD).
4. **Módulos críticos:** 18 (inventario) → 19 (compras/transferencias) → 20 (ventas) → 21 (financiamiento) → 22 (pagos/cajas).
5. **Implementación:** 13 (módulos) → 14 (API) → 15 (frontend) → 16 (seguridad).
6. **Operación:** 26 → 27 → 28 → 30 → 31.
7. **Verificación:** 29 (testing) → 36 (aceptación y checklist).

## Convenciones del documento

- **RF-xxx**: requisito funcional.
- **RNF-xxx**: requisito no funcional.
- **RB-xxx**: regla de negocio.
- **CU-xxx**: caso de uso.
- **ADR-xxx**: decisión arquitectónica.
- **RG-xxx**: riesgo.
- **CA-xxx**: criterio de aceptación.
