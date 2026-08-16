import { SetMetadata } from '@nestjs/common';

export const SEDE_SCOPE_KEY = 'sedeScopeField';

/**
 * Nombre del campo (camelCase, en body o params) que contiene el sede_id a
 * validar contra el alcance del usuario autenticado (RB-018). Si el campo no
 * está presente en la request, el guard no bloquea — el service debe aplicar
 * el alcance por defecto vía SedeScopeService.authorizedSedeIds().
 */
export const RequireSedeScope = (field: string) => SetMetadata(SEDE_SCOPE_KEY, field);
