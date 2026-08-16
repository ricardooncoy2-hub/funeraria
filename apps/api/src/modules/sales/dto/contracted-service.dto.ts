import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ContractedServiceDto {
  @ApiProperty({ maxLength: 40, example: 'VELATORIO' })
  @IsString()
  @MaxLength(40)
  tipoServicio!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaServicio?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  responsableUsuarioId?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
