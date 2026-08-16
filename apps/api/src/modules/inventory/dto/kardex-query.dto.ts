import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class KardexQueryDto {
  @ApiProperty()
  @IsNumberString()
  sedeId!: string;

  @ApiProperty()
  @IsNumberString()
  productoId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
