// Prisma usa BigInt para los IDs; JSON.stringify no lo serializa por defecto.
// Efecto lateral global: se importa tanto desde main.ts como desde el setup
// de Jest, para que aplique también cuando la app se levanta en tests
// (Test.createTestingModule) y no solo vía bootstrap().
if (!('toJSON' in BigInt.prototype)) {
  (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (this: bigint) {
    return this.toString();
  };
}
