import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class AssignQuotationDto {
  @ApiProperty({ description: 'RF-084: sede que atenderá la cotización' })
  @IsNumberString()
  sedeAsignadaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  usuarioAsignadoId?: string;
}
