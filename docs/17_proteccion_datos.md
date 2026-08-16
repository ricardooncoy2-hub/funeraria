# 17 — Protección de Datos Personales (Ley N.° 29733, Perú)

> Este documento orienta el cumplimiento técnico. No constituye asesoría legal; debe validarse con un especialista antes de producción. El sistema se opera en Perú y está sujeto a la Ley N.° 29733 de Protección de Datos Personales y su reglamento vigente, bajo la supervisión de la Autoridad Nacional de Protección de Datos Personales.

## 17.1 Datos personales tratados

| Titular | Datos | Finalidad | Base de tratamiento |
|---|---|---|---|
| Cliente | documento, nombres, apellidos, teléfono, correo, dirección | Gestión de venta/servicio, facturación, contacto | Ejecución de relación contractual/servicio |
| Solicitante web | nombres, teléfono, correo | Atender solicitud de cotización | Consentimiento (formulario) |
| Usuario del sistema | nombres, correo, credenciales | Operación del sistema | Relación laboral/operativa |
| Proveedor/financiador (personas) | contacto | Operación comercial | Relación contractual |

Datos de la operación funeraria (`servicios_contratados`): se limita a datos **operativos mínimos** (tipo, fecha, lugar, responsable). **No** se almacenan datos sensibles del fallecido ni datos de salud innecesarios.

## 17.2 Principios aplicados

- **Minimización:** solo se capturan datos necesarios para la finalidad. Campos personales opcionales (dirección, correo) no son obligatorios salvo que la operación lo requiera.
- **Finalidad:** los datos se usan solo para las finalidades declaradas.
- **Consentimiento:** el formulario público registra `consentimiento_datos` con enlace a la política de privacidad. Sin consentimiento no se procesa la solicitud.
- **Calidad:** datos exactos y actualizables por el titular a solicitud.
- **Seguridad:** medidas técnicas y organizativas (ver [16](16_seguridad.md)).

## 17.3 Derechos ARCO (acceso, rectificación, cancelación, oposición)

- Procedimiento documentado para atender solicitudes de titulares.
- El sistema permite: consultar los datos de un titular (acceso), editarlos (rectificación), y **anonimizar/eliminar lógicamente** (cancelación) cuando no exista obligación legal de conservación.
- Canal de contacto para ejercicio de derechos publicado en el sitio.

## 17.4 Retención y eliminación

- **Datos transaccionales con relevancia contable/tributaria** (ventas, pagos, comprobantes): se conservan por el plazo legal aplicable (referencia: obligaciones tributarias) y **no se eliminan físicamente** (RB-020).
- **Datos de solicitantes web no convertidos en clientes:** política de retención acotada (p. ej. 12 meses) con purga o anonimización posterior (tarea programada).
- **Anonimización:** para el "derecho al olvido" sobre datos no obligados por ley, se reemplazan identificadores por valores anonimizados manteniendo la integridad de agregados históricos.

## 17.5 Control de acceso a datos personales

- Acceso por rol y sede (RBAC). Solo roles con necesidad operativa ven datos de clientes.
- Los reportes consolidados priorizan agregados; el detalle personal se restringe.

## 17.6 Auditoría de tratamiento

- `auditoria` registra accesos y cambios sobre entidades con datos personales (clientes, cotizaciones).
- Trazabilidad de quién accedió/modificó y cuándo.

## 17.7 Seguridad técnica específica

- Contraseñas hasheadas; tokens no expuestos.
- Cifrado en tránsito (HTTPS) y, cuando sea posible, en reposo (volúmenes y backups cifrados).
- Enmascaramiento en logs de datos personales y secretos.
- Backups cifrados con acceso restringido.

## 17.8 Encargados y transferencias

- Si se usan servicios de terceros (correo, S3, Cloudflare), documentar el rol de **encargado de tratamiento** y verificar cláusulas de protección de datos. Preferir proveedores con garantías adecuadas.
- Registrar la ubicación del almacenamiento; si hay transferencia internacional de datos, evaluar las exigencias de la normativa.

## 17.9 Política de privacidad y avisos

- Publicar **Política de Privacidad** y **aviso de consentimiento** en el sitio público.
- El formulario de cotización incluye texto claro de finalidad y checkbox de consentimiento (no premarcado).

## 17.10 Checklist de cumplimiento técnico

- [ ] Consentimiento registrado en formularios públicos.
- [ ] Minimización de campos personales.
- [ ] RBAC + alcance de sede sobre datos personales.
- [ ] Auditoría de accesos/cambios a datos personales.
- [ ] Política de retención y purga/anonimización implementada.
- [ ] Procedimiento ARCO operativo.
- [ ] Cifrado en tránsito y backups cifrados.
- [ ] Enmascaramiento en logs.
- [ ] Política de privacidad publicada.
