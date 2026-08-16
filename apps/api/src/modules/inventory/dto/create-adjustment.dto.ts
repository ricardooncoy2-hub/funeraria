import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsNumberString,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const ADJUSTMENT_TYPES = ['AJUSTE_ENTRADA', 'AJUSTE_SALIDA', 'MERMA'] as const;

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsNumberString()
  sedeId!: string;

  @ApiProperty()
  @IsNumberString()
  productoId!: string;

  @ApiProperty({ enum: ADJUSTMENT_TYPES })
  @IsIn(ADJUSTMENT_TYPES)
  tipo!: (typeof ADJUSTMENT_TYPES)[number];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;

  @ApiProperty({ description: 'Obligatorio (docs/18 §18.6)' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  motivo!: string;
}
