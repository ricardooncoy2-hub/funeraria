import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'Códigos de permiso; reemplaza el conjunto actual.' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permisos!: string[];
}
