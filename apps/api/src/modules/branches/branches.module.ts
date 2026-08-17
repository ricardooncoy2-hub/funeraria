import { Module } from '@nestjs/common';
import { UbigeoModule } from '../ubigeo/ubigeo.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [UbigeoModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
