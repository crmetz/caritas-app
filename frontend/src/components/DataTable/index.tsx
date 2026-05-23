import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableProps } from "./interface";

export function DataTable<T extends { id: number }>({
  columns,
  data,
  pagination,
  isLoading,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const { page, pageSize, totalCount, onPageChange } = pagination;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-t">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr className="border-t">
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-t hover:bg-muted/30 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key as string] ?? "")}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} — {totalCount} registro{totalCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
