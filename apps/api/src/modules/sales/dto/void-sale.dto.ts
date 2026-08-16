import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class VoidSaleDto {
  @ApiProperty({ description: 'Obligatorio (docs/20 §20.7)' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  motivo!: string;
}
