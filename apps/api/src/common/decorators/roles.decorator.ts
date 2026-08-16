import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** El usuario debe tener al menos uno de los roles indicados. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
