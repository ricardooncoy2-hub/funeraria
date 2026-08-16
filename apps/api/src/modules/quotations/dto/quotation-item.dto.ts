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

const ITEM_TIPOS = ['PRODUCTO', 'SERVICIO'] as const;

export class QuotationItemDto {
  @ApiProperty({ enum: ITEM_TIPOS })
  @IsIn(ITEM_TIPOS)
  itemTipo!: (typeof ITEM_TIPOS)[number];

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=PRODUCTO' })
  @ValidateIf((o: QuotationItemDto) => o.itemTipo === 'PRODUCTO')
  @IsNumberString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=SERVICIO' })
  @ValidateIf((o: QuotationItemDto) => o.itemTipo === 'SERVICIO')
  @IsNumberString()
  servicioId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioReferencial?: number;
}
