import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuotationItemDto } from '../../quotations/dto/quotation-item.dto';

/**
 * Cotización creada por un visitante del sitio público (docs/23 §23.2, §23.8-9).
 * A diferencia de `CreateQuotationDto` (uso interno), no acepta `clienteId`
 * (no debe poder vincularse a un cliente existente arbitrario) ni `validoHasta`
 * (lo gestiona el equipo, no el visitante). `origen` no es un campo del body:
 * el servicio lo fija en `'WEB'` del lado del servidor.
 */
export class PublicCreateQuotationDto {
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

  @ApiProperty({ description: 'Ley 29733 (docs/17). Obligatorio y debe ser true.' })
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
