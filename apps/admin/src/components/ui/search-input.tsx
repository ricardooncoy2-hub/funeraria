"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./input";

/** Búsqueda con debounce (evita disparar una consulta por cada tecla). */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => onChange(draft), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" aria-hidden />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label="Buscar"
      />
    </div>
  );
}
