import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const FINANCING_STATES = [
  'PENDIENTE',
  'DOCUMENTADA',
  'ENVIADA',
  'OBSERVADA',
  'APROBADA',
  'RECHAZADA',
  'PARCIALMENTE_PAGADA',
  'PAGADA',
  'CANCELADA',
] as const;

export class SetFinancingStatusDto {
  @ApiProperty({ enum: FINANCING_STATES })
  @IsIn(FINANCING_STATES)
  estado!: (typeof FINANCING_STATES)[number];
}
