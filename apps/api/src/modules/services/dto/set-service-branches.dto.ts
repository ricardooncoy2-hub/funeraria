import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsNumberString,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class ServiceBranchOverrideDto {
  @ApiProperty()
  @IsNumberString()
  sedeId!: string;

  @ApiProperty()
  @IsBoolean()
  disponible!: boolean;

  @ApiPropertyOptional({
    description: 'Override de precio (RB-029); omitir para usar el precio corporativo.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio?: number;
}

export class SetServiceBranchesDto {
  @ApiProperty({ type: [ServiceBranchOverrideDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceBranchOverrideDto)
  sedes!: ServiceBranchOverrideDto[];
}
