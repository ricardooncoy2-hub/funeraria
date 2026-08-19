import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";

const ENLACES = [
  { href: "/servicios", label: "Servicios" },
  { href: "/productos", label: "Productos" },
  { href: "/planes", label: "Planes" },
  { href: "/sedes", label: "Sedes" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
];

/** Footer del sitio público (SKILL.md §20.1, punto 9): enlaces secundarios y aviso de privacidad Ley 29733. */
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3">
          <Image src="/logo-minaya.png" alt="Funeraria Minaya" width={120} height={37} />
          <p className="max-w-xs text-sm text-neutral-700">
            Acompañamos a las familias con serenidad y respeto en cada servicio.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Enlaces del sitio">
          {ENLACES.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-neutral-700 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>

      <div className="border-t border-neutral-200">
        <Container className="flex flex-col gap-2 py-6 text-xs text-neutral-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Funeraria Minaya. Todos los derechos reservados.</p>
          <Link href="/politica-privacidad" className="hover:text-brand-700">
            Política de privacidad (Ley N.° 29733)
          </Link>
        </Container>
      </div>
    </footer>
  );
}
