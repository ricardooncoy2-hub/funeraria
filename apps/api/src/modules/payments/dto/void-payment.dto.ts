import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class VoidPaymentDto {
  @ApiProperty({ description: 'Obligatorio (docs/22 §22.5)' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  motivo!: string;
}
