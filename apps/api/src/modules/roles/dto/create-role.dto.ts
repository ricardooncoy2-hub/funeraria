import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ maxLength: 40, example: 'supervisor_ventas' })
  @IsString()
  @MaxLength(40)
  codigo!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
