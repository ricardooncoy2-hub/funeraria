import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passwordActual!: string;

  @ApiProperty({ minLength: 10, description: 'Mínimo 10 caracteres (docs/16_seguridad.md §16.1)' })
  @IsString()
  @MinLength(10)
  passwordNueva!: string;
}
