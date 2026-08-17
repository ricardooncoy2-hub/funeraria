import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

/** VENTA_EFECTIVO es generado internamente por PaymentsService, no por este endpoint. */
const TIPOS_MOVIMIENTO_MANUAL = ['INGRESO', 'EGRESO', 'RETIRO'] as const;

export class CreateCashMovementDto {
  @ApiProperty({ enum: TIPOS_MOVIMIENTO_MANUAL })
  @IsIn(TIPOS_MOVIMIENTO_MANUAL)
  tipo!: (typeof TIPOS_MOVIMIENTO_MANUAL)[number];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  concepto!: string;
}
