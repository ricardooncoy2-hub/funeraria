import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuotationItemDto } from './quotation-item.dto';

// WEB queda para el endpoint público de Fase 6 (docs/23 §23.2).
const ORIGENES_INTERNOS = ['WHATSAPP', 'TELEFONO', 'PRESENCIAL', 'OTRO'] as const;

export class CreateQuotationDto {
  @ApiProperty({ enum: ORIGENES_INTERNOS })
  @IsIn(ORIGENES_INTERNOS)
  origen!: (typeof ORIGENES_INTERNOS)[number];

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  solicitanteNombres!: string;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  solicitanteTelefono!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  solicitanteCorreo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  sedePreferidaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  planId?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validoHasta?: string;

  @ApiProperty({ description: 'Ley 29733 (docs/17). Obligatorio.' })
  @IsBoolean()
  consentimientoDatos!: boolean;

  @ApiPropertyOptional({ type: [QuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];
}
