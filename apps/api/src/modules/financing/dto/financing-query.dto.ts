import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { FINANCING_STATES } from './set-financing-status.dto';

export class FinancingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FINANCING_STATES })
  @IsOptional()
  @IsIn(FINANCING_STATES)
  estado?: (typeof FINANCING_STATES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  financiadorId?: string;
}
