import type { Metadata } from "next";
import { ProductCard } from "@/components/cards/product-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProductos } from "@/lib/api/productos";

export const metadata: Metadata = {
  title: "Productos",
  description: "Ataúdes, urnas, arreglos florales y accesorios disponibles en Funeraria Minaya.",
  alternates: { canonical: "/productos" },
};

export default async function ProductosPage() {
  const productos = await fetchProductos();

  const porCategoria = new Map<string, typeof productos>();
  for (const producto of productos) {
    const grupo = porCategoria.get(producto.categoria.nombre) ?? [];
    grupo.push(producto);
    porCategoria.set(producto.categoria.nombre, grupo);
  }

  return (
    <>
      <PageHeader
        title="Nuestros productos"
        description="Consulte por disponibilidad y precio según la sede — con gusto lo asesoramos para elegir la mejor opción."
      />
      <Container className="flex flex-col gap-12 py-16">
        <p className="-mt-6 text-xs text-neutral-500">Imágenes referenciales; el producto real puede variar.</p>
        {porCategoria.size === 0 ? (
          <p className="text-neutral-500">Aún no hay productos publicados.</p>
        ) : (
          Array.from(porCategoria.entries()).map(([categoria, items]) => (
            <section key={categoria}>
              <h2 className="mb-6 text-2xl font-semibold text-neutral-950">{categoria}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          ))
        )}
      </Container>
    </>
  );
}
