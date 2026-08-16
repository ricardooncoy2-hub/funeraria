import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetUserRolesDto {
  @ApiProperty({
    type: [String],
    description: 'Códigos de rol; reemplaza el conjunto actual (RF-006).',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roles!: string[];
}
