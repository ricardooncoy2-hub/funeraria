import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsNumberString } from 'class-validator';

export class SetUserSedesDto {
  @ApiProperty({
    type: [String],
    description: 'IDs de sede; reemplaza el conjunto actual (RF-006).',
  })
  @IsArray()
  @ArrayUnique()
  @IsNumberString({}, { each: true })
  sedeIds!: string[];
}
