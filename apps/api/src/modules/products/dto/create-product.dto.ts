import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ maxLength: 40, description: 'SKU' })
  @IsString()
  @MaxLength(40)
  codigo!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID de categorías_producto' })
  @IsNumberString()
  categoriaProductoId!: string;

  @ApiProperty({ maxLength: 20, example: 'UNIDAD' })
  @IsString()
  @MaxLength(20)
  unidadMedida!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioVenta!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  afectoIgv?: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagenUrl?: string;
}
