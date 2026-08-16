import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ContractedServiceDto } from './contracted-service.dto';
import { SaleItemDto } from './sale-item.dto';

export class CreateSaleDto {
  @ApiProperty()
  @IsNumberString()
  sedeVentaId!: string;

  @ApiProperty()
  @IsNumberString()
  clienteId!: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @ApiPropertyOptional({ default: 0, description: 'Descuento global sobre el subtotal (RC-002)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuentoGlobal?: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;

  @ApiPropertyOptional({
    type: [ContractedServiceDto],
    description: 'Operación(es) funeraria(s) asociadas (docs/20 §20.6, ADR-014)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractedServiceDto)
  serviciosContratados?: ContractedServiceDto[];
}
