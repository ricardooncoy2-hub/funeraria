export interface AuthenticatedUser {
  id: bigint;
  correo: string;
  usuario: string;
  nombres: string;
  apellidos: string;
  esCorporativo: boolean;
  mustChangePassword: boolean;
  roles: string[];
  permisos: string[];
  /** Sedes explícitamente asignadas (usuario_sede). Vacío si isCorporate=true. */
  sedeIds: bigint[];
  /** true si es_corporativo=1 o tiene el permiso sede.acceso_total (RB-018/019). */
  isCorporate: boolean;
}
