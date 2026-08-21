import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Acento tipográfico solo para titulares grandes del sitio público (SKILL.md §4) — nunca en admin, párrafos ni botones. */
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPCION =
  "Servicios funerarios, planes a futuro y acompañamiento cercano para su familia. Cotice en línea o escríbanos por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Funeraria Minaya — Servicios funerarios con calidez y respeto",
    template: "%s — Funeraria Minaya",
  },
  description: DESCRIPCION,
  // CA-SEO-02: el sitio público sí es indexable (a diferencia del admin, que
  // declara robots:{index:false} en su propio layout) — explícito para que
  // no dependa del default de Next.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Funeraria Minaya",
    title: "Funeraria Minaya — Servicios funerarios con calidez y respeto",
    description: DESCRIPCION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
