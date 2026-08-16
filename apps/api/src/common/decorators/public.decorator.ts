import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Exime al endpoint del JwtAuthGuard global (p. ej. login, refresh, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
