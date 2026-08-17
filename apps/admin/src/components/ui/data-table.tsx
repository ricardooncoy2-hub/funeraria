"use client";

import {
  type ColumnDef,
  type RowData,
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

/**
 * @tanstack/react-table v9 (API nueva, no confundir con v8: `useTable` en vez
 * de `useReactTable`, sin `getCoreRowModel()`, render vía `table.FlexRender`).
 * Un único `features` vacío compartido: estas tablas son de solo listado con
 * paginación server-side, no necesitan sorting/filtering/selection del lado
 * del cliente.
 */
export const tableFeatureSet = tableFeatures({});

export function createTableColumns<TData extends RowData>() {
  return createColumnHelper<typeof tableFeatureSet, TData>();
}

// Un array de columnas heterogéneo necesita `any` en TValue (igual que el propio
// tipo de retorno de `columnHelper.columns()`); cada `columnHelper.accessor(...)`
// sigue infiriendo su TValue real en el sitio de uso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableColumn<TData extends RowData> = ColumnDef<typeof tableFeatureSet, TData, any>;

/** SKILL.md §14 — tabla estándar del admin: header neutral-100, hover de fila, estados explícitos. */
export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  emptyTitle,
  emptyDescription,
  onRowClick,
}: {
  columns: TableColumn<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyTitle: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
}) {
  const table = useTable({ features: tableFeatureSet, columns, data });

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-neutral-700"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-neutral-200">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-40" />
                  </td>
                ))}
              </tr>
            ))
          ) : isError ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <AlertCircle className="size-8 text-danger-600" aria-hidden />
                  <p className="text-sm font-medium text-neutral-950">No se pudo cargar la información</p>
                  {errorMessage && <p className="max-w-sm text-sm text-neutral-500">{errorMessage}</p>}
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={
                  "border-t border-neutral-200" +
                  (onRowClick ? " cursor-pointer hover:bg-neutral-100" : "")
                }
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
