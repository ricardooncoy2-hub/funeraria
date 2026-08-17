import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class OpenCashDto {
  @ApiProperty({ description: 'Saldo inicial en efectivo (docs/22 §22.6)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoInicial!: number;
}
