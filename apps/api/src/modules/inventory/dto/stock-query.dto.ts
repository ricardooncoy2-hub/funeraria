import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class StockQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Si se omite, se usan todas las sedes autorizadas del usuario.',
  })
  @IsOptional()
  @IsNumberString()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  productoId?: string;
}
