# 02 — Alcance

## 2.1 Incluido en el alcance (v1)

### Backend / operación
- Gestión de **sedes** (corporativo) con identificación de sede principal.
- Gestión de **usuarios, roles y permisos** con alcance por sede (RBAC).
- Autenticación con JWT + refresh tokens.
- Catálogo maestro de **productos** y **categorías de producto**.
- Catálogo de **servicios** funerarios con disponibilidad y precio por sede.
- **Planes/paquetes** que agrupan productos y servicios.
- Gestión de **proveedores**.
- **Compras centralizadas** (sede principal).
- **Inventario por sede** + **movimientos de inventario** (kardex).
- **Transferencias de inventario** entre sedes con estados.
- Gestión de **clientes** con minimización de datos.
- **Ventas** (productos, servicios, planes, descuentos).
- Entidad **servicios contratados** para la operación funeraria (ver [20](20_ventas.md)).
- **Cotizaciones** (web, WhatsApp, teléfono, presencial).
- **Financiadores** (cliente, SIS, EsSalud, aseguradoras, instituciones).
- **Financiamientos** multi-fuente y **coberturas**.
- **Cuentas por cobrar** a financiadores.
- **Pagos** múltiples por venta, con **método** y **destino** separados.
- **Cajas** de efectivo (apertura, movimientos, cierre, arqueo).
- **Reportes** por sede y consolidados.
- **Auditoría** de eventos críticos.

### Sitio público
- Inicio, Nosotros, Servicios, Productos, Planes, Promociones, Sedes, Contacto, Preguntas frecuentes, Solicitud de cotización.
- Contacto por WhatsApp.
- SEO, mobile-first, performance y accesibilidad.

## 2.2 Fuera del alcance (v1)

Se excluye explícitamente para evitar sobreingeniería y controlar costos:

- **Facturación electrónica SUNAT** (emisión de comprobantes electrónicos con OSE/PSE). Se contempla el **diseño extensible** para integrarla después, pero no la integración en v1.
- **Contabilidad general / libros contables.** La caja controla efectivo, no reemplaza un ERP contable.
- **Conciliación bancaria automática.** El modelo de pagos/destinos deja los datos listos para conciliación futura, pero la conciliación automatizada no se implementa en v1.
- **Pasarela de pago online** en el sitio público (el pago es presencial/transferencia gestionado por la empresa).
- **App móvil nativa.** El admin es web responsive.
- **Compras directas por sedes provinciales** (deshabilitado por regla; extensible a futuro — ver RB-001).
- **Microservicios, Kubernetes, multi-tenant con bases separadas.**
- **Nómina / RRHH / planillas.**
- **Integración con SIS/EsSalud vía API institucional** (se modela como financiador manual; integración futura opcional).

## 2.3 Supuestos

- La empresa opera con **una sola razón social** (una empresa, múltiples sedes). El modelo deja espacio para configuración de empresa pero no para multi-empresa.
- El volumen transaccional es propio de una PYME (decenas a bajas centenas de operaciones diarias como máximo).
- Los usuarios administrativos operan desde navegadores modernos.
- La moneda es **PEN (Soles)**. Se contempla un campo de moneda por si se requiere USD, pero el sistema opera principalmente en PEN.
- Impuesto aplicable: **IGV (18%)** configurable; algunos servicios funerarios pueden estar exonerados/inafectos — el sistema debe permitir marcar afectación de IGV por ítem.
- Conectividad a internet estable en la sede principal; las sedes provinciales pueden tener conectividad intermitente (el sistema es web centralizado; no hay modo offline en v1).

## 2.4 Restricciones

- **Base de datos única MariaDB** (no una por sede).
- **Nomenclatura de BD obligatoria** (ver [11](11_convencion_base_datos.md)).
- **Monolito modular** en NestJS (ADR-001).
- **Despliegue en un VPS** con Docker Compose (no orquestadores complejos).
- Cumplimiento de **Ley N.° 29733** (protección de datos personales, Perú).
- Presupuesto y equipo pequeños: priorizar simplicidad y mantenibilidad.

## 2.5 Criterios de éxito del alcance

- El sistema modela correctamente los 3 pilares: sede venta≠cobro, venta≠financiamiento≠pago, financiadores≠métodos de pago.
- Un desarrollador o Claude Code puede implementar cada módulo sin inventar reglas de negocio fundamentales.
- La documentación pasa el **Checklist de consistencia** de [36](36_criterios_aceptacion.md) sin contradicciones.
