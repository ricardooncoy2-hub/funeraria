import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

// 'CLIENTE' no se usa en la práctica: el financiamiento del cliente referencia
// cliente_id directamente (docs/21 §21.2). Se acepta en el enum por fidelidad
// al modelo de datos (doc10 §10.5), no se espera crear filas de ese tipo.
const TIPOS_FINANCIADOR = [
  'CLIENTE',
  'SIS',
  'ESSALUD',
  'ASEGURADORA',
  'INSTITUCION',
  'EMPRESA',
  'CONVENIO',
  'OTRO',
] as const;

export class CreateFinanciadorDto {
  @ApiProperty({ enum: TIPOS_FINANCIADOR })
  @IsIn(TIPOS_FINANCIADOR)
  tipo!: (typeof TIPOS_FINANCIADOR)[number];

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  tipoDocumento?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  numeroDocumento?: string;

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

  @ApiPropertyOptional({ description: 'Plazo para CxC' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diasCredito?: number;
}
