import { Module } from '@nestjs/common';
import { UbigeoController } from './ubigeo.controller';
import { UbigeoService } from './ubigeo.service';

@Module({
  controllers: [UbigeoController],
  providers: [UbigeoService],
  exports: [UbigeoService],
})
export class UbigeoModule {}
