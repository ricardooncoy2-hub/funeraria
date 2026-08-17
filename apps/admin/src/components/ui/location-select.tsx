"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchDepartamentos, fetchDistrito, fetchDistritos, fetchProvincias } from "@/lib/api/ubigeo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

/**
 * Selector jerárquico Departamento → Provincia → Distrito (ADR-019),
 * reutilizable en cualquier formulario que pida ubicación. Controlado por
 * un único `value` (el `distritoId`); departamento/provincia se derivan
 * internamente y nunca se exponen como estado propio del formulario padre
 * — así ningún formulario puede terminar guardando una combinación
 * inconsistente entre los tres.
 *
 * Depende de que el formulario que lo usa se remonte al abrir/cambiar de
 * registro (patrón `{open && <Modal .../>}` ya usado en todo el admin) para
 * partir de estado limpio en modo edición — no reinicia estado en un efecto.
 */
export function LocationSelect({
  value,
  onChange,
  invalid,
  disabled,
}: {
  /** distritoId actual, o `undefined`/`""` si no hay ubicación seleccionada. */
  value: string | undefined;
  onChange: (distritoId: string | undefined) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  // `null` = todavía no lo tocó el usuario, usar lo hidratado desde `value`.
  const [departamentoOverride, setDepartamentoOverride] = useState<string | null>(null);
  const [provinciaOverride, setProvinciaOverride] = useState<string | null>(null);

  // Modo edición: `value` ya trae un distritoId pero no sabemos a qué
  // provincia/departamento pertenece — se resuelve su cadena completa.
  const chainQuery = useQuery({
    queryKey: ["ubigeo", "distrito-cadena", value],
    queryFn: () => fetchDistrito(value as string),
    enabled: !!value,
  });

  const departamentoId = departamentoOverride ?? chainQuery.data?.provincia.departamento.id ?? "";
  const provinciaId = provinciaOverride ?? chainQuery.data?.provincia.id ?? "";

  const departamentosQuery = useQuery({
    queryKey: ["ubigeo", "departamentos"],
    queryFn: fetchDepartamentos,
    staleTime: Infinity,
  });
  const provinciasQuery = useQuery({
    queryKey: ["ubigeo", "provincias", departamentoId],
    queryFn: () => fetchProvincias(departamentoId),
    enabled: !!departamentoId,
  });
  const distritosQuery = useQuery({
    queryKey: ["ubigeo", "distritos", provinciaId],
    queryFn: () => fetchDistritos(provinciaId),
    enabled: !!provinciaId,
  });

  function handleDepartamentoChange(next: string) {
    setDepartamentoOverride(next);
    setProvinciaOverride(""); // "" ≠ null: ya no cae al valor hidratado.
    onChange(undefined);
  }

  function handleProvinciaChange(next: string) {
    setProvinciaOverride(next);
    onChange(undefined);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <Select value={departamentoId} onValueChange={handleDepartamentoChange} disabled={disabled}>
          <SelectTrigger invalid={invalid} aria-label="Departamento">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            {(departamentosQuery.data ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select
          value={provinciaId}
          onValueChange={handleProvinciaChange}
          disabled={disabled || !departamentoId}
        >
          <SelectTrigger invalid={invalid} aria-label="Provincia">
            <SelectValue placeholder="Provincia" />
          </SelectTrigger>
          <SelectContent>
            {(provinciasQuery.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select
          value={value ?? ""}
          onValueChange={(next) => onChange(next || undefined)}
          disabled={disabled || !provinciaId}
        >
          <SelectTrigger invalid={invalid} aria-label="Distrito">
            <SelectValue placeholder="Distrito" />
          </SelectTrigger>
          <SelectContent>
            {(distritosQuery.data ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
