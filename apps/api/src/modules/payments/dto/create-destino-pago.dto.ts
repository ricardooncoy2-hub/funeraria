import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

const TIPOS_DESTINO = ['CAJA', 'CUENTA_BANCARIA', 'POS', 'BILLETERA_DIGITAL', 'OTRO'] as const;

export class CreateDestinoPagoDto {
  @ApiProperty({ enum: TIPOS_DESTINO })
  @IsIn(TIPOS_DESTINO)
  tipo!: (typeof TIPOS_DESTINO)[number];

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Sede que administra el destino (RB-009)' })
  @IsOptional()
  @IsNumberString()
  sedeAdministradoraId?: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipo=CAJA (docs/10 §10.5)' })
  @ValidateIf((dto: CreateDestinoPagoDto) => dto.tipo === 'CAJA')
  @IsNumberString()
  cajaId?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  numeroReferencia?: string;
}
