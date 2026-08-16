import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string, metadata: ArgumentMetadata): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException({
        code: 'ID_INVALIDO',
        message: `El parámetro '${metadata.data}' debe ser un identificador numérico.`,
      });
    }
    return BigInt(value);
  }
}
