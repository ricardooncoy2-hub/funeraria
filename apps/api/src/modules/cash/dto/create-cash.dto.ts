import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, MaxLength } from 'class-validator';

export class CreateCashDto {
  @ApiProperty({ description: 'Sede a la que pertenece la caja' })
  @IsNumberString()
  sedeId!: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  nombre!: string;
}
