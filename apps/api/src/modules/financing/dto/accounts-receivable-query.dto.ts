import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, Min } from 'class-validator';

export class AccountsReceivableQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  financiadorId?: string;

  @ApiPropertyOptional({
    description: 'Si se omite, se usan todas las sedes autorizadas del usuario.',
  })
  @IsOptional()
  @IsNumberString()
  sedeId?: string;

  @ApiPropertyOptional({ description: 'Antigüedad mínima en días (filtra por dias >= valor).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  antiguedadMinima?: number;
}
