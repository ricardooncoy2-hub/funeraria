import { Prisma } from '@prisma/client';

export type PrismaTransaction = Prisma.TransactionClient;

/** docs/18_inventario.md §18.2 */
export const MOVEMENT_TYPES = [
  'COMPRA',
  'TRANSFERENCIA_ENTRADA',
  'TRANSFERENCIA_SALIDA',
  'VENTA',
  'DEVOLUCION',
  'AJUSTE_ENTRADA',
  'AJUSTE_SALIDA',
  'MERMA',
  'ANULACION_VENTA',
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const ENTRY_TYPES: ReadonlySet<MovementType> = new Set([
  'COMPRA',
  'TRANSFERENCIA_ENTRADA',
  'DEVOLUCION',
  'AJUSTE_ENTRADA',
  'ANULACION_VENTA',
]);

/** docs/18 §18.4: solo estas entradas recalculan costo_promedio (RC-001). */
export const COST_RECALC_TYPES: ReadonlySet<MovementType> = new Set([
  'COMPRA',
  'TRANSFERENCIA_ENTRADA',
  'DEVOLUCION',
]);

export interface ApplyMovementParams {
  sedeId: bigint;
  productoId: bigint;
  tipo: MovementType;
  cantidad: Prisma.Decimal.Value;
  costoUnitario?: Prisma.Decimal.Value;
  documentoTipo?: string;
  documentoId?: bigint;
  motivo?: string;
  usuarioId: bigint;
}

export interface ApplyMovementResult {
  stockAnterior: Prisma.Decimal;
  stockPosterior: Prisma.Decimal;
  costoPromedio: Prisma.Decimal;
}
