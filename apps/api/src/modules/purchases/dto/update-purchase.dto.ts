import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseDto } from './create-purchase.dto';

/** Solo aplicable mientras la compra esté en BORRADOR (docs/19 §19.1). */
export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {}
