import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsNumberString, IsPositive, ValidateIf } from 'class-validator';

const ITEM_TIPOS = ['PRODUCTO', 'SERVICIO'] as const;

export class PlanItemDto {
  @ApiProperty({ enum: ITEM_TIPOS })
  @IsIn(ITEM_TIPOS)
  itemTipo!: (typeof ITEM_TIPOS)[number];

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=PRODUCTO' })
  @ValidateIf((o: PlanItemDto) => o.itemTipo === 'PRODUCTO')
  @IsNumberString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Requerido si itemTipo=SERVICIO' })
  @ValidateIf((o: PlanItemDto) => o.itemTipo === 'SERVICIO')
  @IsNumberString()
  servicioId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;
}
