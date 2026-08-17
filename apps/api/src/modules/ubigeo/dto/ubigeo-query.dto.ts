import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class ProvinciaQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por departamento' })
  @IsOptional()
  @IsNumberString()
  departamentoId?: string;
}

export class DistritoQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por provincia' })
  @IsOptional()
  @IsNumberString()
  provinciaId?: string;
}
