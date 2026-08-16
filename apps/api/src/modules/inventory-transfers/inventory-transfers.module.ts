import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryTransfersController } from './inventory-transfers.controller';
import { InventoryTransfersService } from './inventory-transfers.service';

@Module({
  imports: [InventoryModule],
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
  exports: [InventoryTransfersService],
})
export class InventoryTransfersModule {}
