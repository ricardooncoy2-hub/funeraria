import { Module } from '@nestjs/common';
import { QuotationsModule } from '../quotations/quotations.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [QuotationsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
