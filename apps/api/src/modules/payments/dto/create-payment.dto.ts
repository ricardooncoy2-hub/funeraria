import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumberString()
  financiamientoId!: string;

  @ApiProperty()
  @IsNumberString()
  metodoPagoId!: string;

  @ApiProperty()
  @IsNumberString()
  destinoPagoId!: string;

  @ApiProperty({
    description: 'Sede donde se recibe el dinero (RB-007, puede diferir de la sede de venta)',
  })
  @IsNumberString()
  sedeCobroId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referencia?: string;
}
