import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFinanciadorDto } from './create-financiador.dto';

export class UpdateFinanciadorDto extends PartialType(CreateFinanciadorDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
