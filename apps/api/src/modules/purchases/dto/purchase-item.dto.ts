import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsPositive } from 'class-validator';

export class PurchaseItemDto {
  @ApiProperty()
  @IsNumberString()
  productoId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoUnitario!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  afectoIgv?: boolean;
}
