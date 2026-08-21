/**
 * Único lugar donde se leen `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_WHATSAPP_NUMBER`
 * con su fallback de desarrollo. Usa `||` en vez de `??`: en el build de
 * Docker, si `docker compose build` corre sin resolver el `${...}` del
 * `build.args` (p. ej. sin el `.env` raíz), Compose pasa el ARG como string
 * vacío, no como `undefined` — `??` no cae al fallback en ese caso y
 * `new URL("")` revienta el build (`ERR_INVALID_URL`) en vez de degradar
 * a un valor por defecto.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51999999999";
