import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

const TIPOS_DOCUMENTO = ['DNI', 'CE', 'RUC'] as const;

export class CreateSupplierDto {
  @ApiProperty({ enum: TIPOS_DOCUMENTO })
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento!: (typeof TIPOS_DOCUMENTO)[number];

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  numeroDocumento!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  razonSocial!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombreComercial?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({ description: 'Distrito del catálogo de ubigeo (ADR-019)' })
  @IsOptional()
  @IsNumberString()
  distritoId?: string;
}
