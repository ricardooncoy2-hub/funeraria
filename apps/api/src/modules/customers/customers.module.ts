import { Module } from '@nestjs/common';
import { UbigeoModule } from '../ubigeo/ubigeo.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [UbigeoModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
