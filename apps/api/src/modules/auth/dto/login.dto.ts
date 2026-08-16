import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Correo o nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  usuario!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
