import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  nombres!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  apellidos!: string;

  @ApiProperty({ maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  correo!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MaxLength(60)
  usuario!: string;

  @ApiProperty({ minLength: 10, description: 'Mínimo 10 caracteres (docs/16_seguridad.md §16.1)' })
  @IsString()
  @MinLength(10)
  password!: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Acceso a todas las sedes. Solo admin_corporativo puede fijarlo en true (RF-007).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esCorporativo?: boolean;
}
