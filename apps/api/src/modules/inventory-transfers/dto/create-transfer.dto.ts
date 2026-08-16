import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TransferItemDto } from './transfer-item.dto';

export class CreateTransferDto {
  @ApiProperty({ description: 'Sede origen (típicamente la principal, docs/19 §19.2)' })
  @IsNumberString()
  sedeOrigenId!: string;

  @ApiProperty()
  @IsNumberString()
  sedeDestinoId!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}
