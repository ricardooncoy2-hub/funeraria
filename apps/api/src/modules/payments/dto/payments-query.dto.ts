import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por venta.' })
  @IsOptional()
  @IsNumberString()
  ventaId?: string;

  @ApiPropertyOptional({ description: 'Filtra por sede de cobro.' })
  @IsOptional()
  @IsNumberString()
  sedeCobroId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por código de método de pago (EFECTIVO, TRANSFERENCIA, etc.).',
  })
  @IsOptional()
  @IsString()
  metodo?: string;
}
