import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  Min,
  ValidateIf,
} from 'class-validator';

const ITEM_TIPOS = ['PRODUCTO', 'SERVICIO', 'PLAN'] as const;

export class SaleItemDto {
  @ApiProperty({ enum: ITEM_TIPOS })
  @IsIn(ITEM_TIPOS)
  itemTipo!: (typeof ITEM_TIPOS)[number];

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=PRODUCTO' })
  @ValidateIf((o: SaleItemDto) => o.itemTipo === 'PRODUCTO')
  @IsNumberString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=SERVICIO' })
  @ValidateIf((o: SaleItemDto) => o.itemTipo === 'SERVICIO')
  @IsNumberString()
  servicioId?: string;

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=PLAN' })
  @ValidateIf((o: SaleItemDto) => o.itemTipo === 'PLAN')
  @IsNumberString()
  planId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuentoLinea?: number;
}
