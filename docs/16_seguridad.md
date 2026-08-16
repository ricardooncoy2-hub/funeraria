# 16 — Seguridad

## 16.1 Autenticación

- **JWT de acceso** de vida corta (15 min) firmado con secreto/clave (HS256 o RS256).
- **Refresh token** de vida larga (7–30 días), almacenado como **hash** en `refresh_tokens` para permitir revocación; entregado en **cookie httpOnly, Secure, SameSite=Strict** al admin.
- Rotación de refresh: cada refresh emite uno nuevo e invalida el anterior (detección de reutilización → revoca la familia).
- Logout revoca el refresh actual.
- **Hash de contraseñas:** `argon2id` (recomendado) o `bcrypt` (cost ≥ 12). Nunca texto plano ni MD5/SHA simple.
- Política de contraseñas: mínimo 10 caracteres; bloqueo temporal tras N intentos fallidos; `must_change_password` en primer login.

## 16.2 Autorización (RBAC + alcance de sede)

Modelo conceptual: **USUARIO + ROL + PERMISO + SEDE**.

- **Permisos** granulares por acción (`ventas.crear`, `inventario.ajustar`, `transferencias.aprobar`, `caja.cerrar`, `reportes.consolidado`, `usuarios.gestionar`, `sede.acceso_total`).
- **Roles** agrupan permisos (ver matriz abajo).
- **Alcance de sede:** además del permiso, cada operación valida que la(s) sede(s) implicada(s) pertenezcan al usuario (`usuario_sede`) o que tenga `sede.acceso_total`/`es_corporativo`.

### Cadena de verificación (backend)
```
JwtAuthGuard → RolesGuard(@Permissions) → SedeScopeGuard(@RequireSedeScope) → Service (regla de negocio)
```

Nunca se confía en `sede_id` del cliente sin validarlo contra el alcance del usuario (RB-018).

### Matriz de autorización (permiso × rol)

| Permiso | admin_corp | admin_sede | vendedor | enc_inv | enc_caja | supervisor | consulta |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `sede.acceso_total` | ✔ | | | | | | |
| `config.gestionar` | ✔ | | | | | | |
| `sedes.gestionar` | ✔ | | | | | | |
| `usuarios.gestionar` | ✔ | (parcial) | | | | | |
| `roles.gestionar` | ✔ | | | | | | |
| `catalogo.gestionar` | ✔ | | | | | | |
| `catalogo.leer` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `compras.gestionar` | ✔ | ✔(principal) | | | | | |
| `inventario.leer` | ✔ | ✔ | ✔ | ✔ | | ✔ | ✔ |
| `inventario.ajustar` | ✔ | ✔ | | ✔ | | | |
| `transferencias.solicitar` | ✔ | ✔ | | ✔ | | | |
| `transferencias.aprobar` | ✔ | ✔ | | | | ✔ | |
| `transferencias.recibir` | ✔ | ✔ | | ✔ | | | |
| `ventas.crear` | ✔ | ✔ | ✔ | | | | |
| `ventas.anular` | ✔ | ✔ | | | | ✔ | |
| `cotizaciones.gestionar` | ✔ | ✔ | ✔ | | | ✔ | |
| `financiamiento.gestionar` | ✔ | ✔ | ✔ | | | | |
| `pagos.registrar` | ✔ | ✔ | ✔ | | ✔ | | |
| `pagos.anular` | ✔ | ✔ | | | | ✔ | |
| `caja.operar` | ✔ | ✔ | | | ✔ | | |
| `caja.cerrar` | ✔ | ✔ | | | ✔ | ✔ | |
| `reportes.sede` | ✔ | ✔ | parcial | parcial | parcial | ✔ | ✔ |
| `reportes.consolidado` | ✔ | | | | | ✔(si multi) | |
| `auditoria.leer` | ✔ | ✔(su sede) | | | | ✔ | |

## 16.3 Protección de la API

- **Validación de DTO** con `class-validator` + `whitelist`/`forbidNonWhitelisted`.
- **Rate limiting** (`@nestjs/throttler`): login (p. ej. 5/min por IP), cotización pública (p. ej. 3/min por IP), global razonable.
- **CORS** restringido a los dominios del sitio y del admin.
- **Helmet** para cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options, etc.).
- **SQL Injection:** Prisma parametriza; prohibido concatenar SQL crudo con input.
- **XSS:** el frontend escapa por defecto (React); no usar `dangerouslySetInnerHTML` con datos del usuario.
- **CSRF:** el admin usa Bearer en memoria para llamadas; el refresh en cookie httpOnly usa SameSite=Strict + endpoint dedicado; formularios públicos con token anti-CSRF si aplica.
- **Mass assignment:** DTOs explícitos, nunca volcar `req.body` a Prisma.

## 16.4 Gestión de secretos

- Secretos (JWT, credenciales MariaDB, S3, correo) en variables de entorno del contenedor, provistas por archivo `.env` fuera del repositorio o un gestor (Docker secrets / SOPS). Nunca en el código ni en el repositorio.
- Rotación periódica de claves JWT (soporte de `kid` si RS256).

## 16.5 Transporte

- **HTTPS** obligatorio en `www`, `app`, `api`. TLS terminado en Cloudflare y/o Nginx. HSTS activo.
- Cookies siempre `Secure`.

## 16.6 Seguridad de datos

- Minimización de datos personales (ver [17](17_proteccion_datos.md)).
- Enmascaramiento de datos sensibles en logs (no loguear contraseñas, tokens, números completos de cuenta).
- Cifrado en reposo del volumen del VPS/DB si el proveedor lo permite; backups cifrados.

## 16.7 Auditoría de seguridad

- Registrar en `auditoria`: login/logout, cambios de permisos, anulaciones, accesos denegados relevantes.
- Alertar ante patrones anómalos (múltiples 403, fuerza bruta de login).

## 16.8 Principios

1. Seguridad **en el backend**, nunca solo en el frontend.
2. Menor privilegio por rol y sede.
3. Defensa en profundidad (validación + guard + constraint de BD).
4. Fallar cerrado (denegar por defecto).
