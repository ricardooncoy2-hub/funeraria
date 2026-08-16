import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const ORIGEN_TIPOS = ['CLIENTE', 'FINANCIADOR'] as const;

export class FinancingInputDto {
  @ApiProperty({ enum: ORIGEN_TIPOS })
  @IsIn(ORIGEN_TIPOS)
  origenTipo!: (typeof ORIGEN_TIPOS)[number];

  @ApiPropertyOptional({ description: 'Requerido si origenTipo=FINANCIADOR' })
  @ValidateIf((o: FinancingInputDto) => o.origenTipo === 'FINANCIADOR')
  @IsNumberString()
  financiadorId?: string;

  @ApiProperty({
    description: 'Porción del total asumida por este financiamiento (RB-021: Σ = total)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;

  @ApiPropertyOptional({
    description: 'RB-014: monto que la institución autoriza, si difiere de monto',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  montoAutorizado?: number;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numeroPoliza?: string;
}
