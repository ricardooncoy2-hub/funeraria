import type { Metadata } from "next";
import Image from "next/image";
import { ProductCard } from "@/components/cards/product-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProductos } from "@/lib/api/productos";

export const metadata: Metadata = {
  title: "Productos",
  description: "Ataúdes, urnas, arreglos florales y accesorios disponibles en Funeraria Minaya.",
  alternates: { canonical: "/productos" },
};

/** Fotos reales de catálogo (no ligadas a un producto puntual del listado de abajo). */
const CATALOGO_EJEMPLOS = [
  { src: "/fotos/catalogo-figaro-frances.jpg", alt: "Ataúd modelo Fígaro Francés, madera" },
  { src: "/fotos/catalogo-lincoln-redondo.jpg", alt: "Ataúd modelo Lincoln Redondo, metal marmoleado" },
  { src: "/fotos/catalogo-faraon.jpg", alt: "Ataúd modelo Faraón, enchapado en cedro" },
];

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
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-neutral-950">Ejemplos de nuestro catálogo</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CATALOGO_EJEMPLOS.map((foto) => (
              <div key={foto.src} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  width={1200}
                  height={860}
                  priority
                  className="h-56 w-full object-contain"
                />
              </div>
            ))}
          </div>
        </section>

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
