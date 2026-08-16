import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsNumberString, IsPositive } from 'class-validator';

export class TransferItemDto {
  @ApiProperty()
  @IsNumberString()
  productoId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cantidad!: number;
}
