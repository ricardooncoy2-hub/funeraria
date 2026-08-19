import { apiFetch } from "./client";

export interface QuotationItemInput {
  itemTipo: "PRODUCTO" | "SERVICIO";
  productoId?: string;
  servicioId?: string;
  cantidad: number;
  precioReferencial?: number;
}

export interface PublicQuotationInput {
  solicitanteNombres: string;
  solicitanteTelefono: string;
  solicitanteCorreo?: string;
  sedePreferidaId?: string;
  planId?: string;
  observaciones?: string;
  consentimientoDatos: boolean;
  items?: QuotationItemInput[];
}

export interface PublicQuotation {
  id: string;
  codigo: string;
  origen: "WEB";
  estado: string;
}

export function crearCotizacion(input: PublicQuotationInput): Promise<PublicQuotation> {
  return apiFetch<PublicQuotation>("/public/cotizaciones", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}
