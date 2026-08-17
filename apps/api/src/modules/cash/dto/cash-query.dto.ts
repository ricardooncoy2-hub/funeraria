import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CashQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por sede (validado contra el alcance del usuario)' })
  @IsOptional()
  @IsNumberString()
  sedeId?: string;
}
