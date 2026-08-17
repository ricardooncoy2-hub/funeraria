import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CloseCashDto {
  @ApiProperty({ description: 'Saldo contado físicamente al cierre (docs/22 §22.6)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoContado!: number;
}
