import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Catálogo de ubigeo del Perú (ADR-019) — solo lectura, sembrado una vez
 * (`prisma/seed.ts`). Fuente de verdad reutilizada por cualquier módulo que
 * necesite validar/resolver una ubicación (sedes, clientes, proveedores y
 * los que se agreguen a futuro) para no duplicar la lógica de validación.
 */
@Injectable()
export class UbigeoService {
  constructor(private readonly prisma: PrismaService) {}

  findAllDepartamentos() {
    return this.prisma.departamento.findMany({ orderBy: { nombre: 'asc' } });
  }

  findProvincias(departamentoId?: bigint) {
    return this.prisma.provincia.findMany({
      where: departamentoId ? { departamentoId } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  findDistritos(provinciaId?: bigint) {
    return this.prisma.distrito.findMany({
      where: provinciaId ? { provinciaId } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneDistrito(id: bigint) {
    const distrito = await this.prisma.distrito.findUnique({
      where: { id },
      include: { provincia: { include: { departamento: true } } },
    });
    if (!distrito)
      throw new NotFoundException({
        code: 'DISTRITO_NO_ENCONTRADO',
        message: 'Distrito no encontrado.',
      });
    return distrito;
  }

  /** Reutilizado por BranchesService/CustomersService/SuppliersService antes
   * de guardar un distrito_id (docs/14 — validación también en backend). */
  async assertDistritoExists(id: bigint): Promise<void> {
    const exists = await this.prisma.distrito.findUnique({ where: { id }, select: { id: true } });
    if (!exists)
      throw new NotFoundException({
        code: 'DISTRITO_NO_ENCONTRADO',
        message: 'Distrito no encontrado.',
      });
  }
}
