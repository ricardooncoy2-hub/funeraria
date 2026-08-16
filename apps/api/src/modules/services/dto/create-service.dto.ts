import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ maxLength: 40 })
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

  @ApiProperty({
    description: 'Precio corporativo base (RB-029: sede_servicio.precio lo puede sobreescribir)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioBase!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  afectoIgv?: boolean;
}
