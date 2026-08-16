import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateDestinoPagoDto } from './create-destino-pago.dto';

export class UpdateDestinoPagoDto extends PartialType(CreateDestinoPagoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
