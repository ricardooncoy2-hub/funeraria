import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const QUOTATION_STATES = [
  'SOLICITADA',
  'EN_REVISION',
  'ASIGNADA',
  'CONTACTADA',
  'EN_NEGOCIACION',
  'ACEPTADA',
  'RECHAZADA',
  'VENCIDA',
  'CANCELADA',
] as const;

export class SetQuotationStatusDto {
  @ApiProperty({ enum: QUOTATION_STATES })
  @IsIn(QUOTATION_STATES)
  estado!: (typeof QUOTATION_STATES)[number];
}
