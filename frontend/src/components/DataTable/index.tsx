import { Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "./interface";

const alignClass = {
	left: "text-left",
	right: "text-right",
	center: "text-center",
} as const;

export function DataTable<T extends { id: number }>({
	columns,
	data,
	pagination,
	isLoading,
	onEdit,
	onView,
	onDelete,
	canEdit,
	canDelete,
}: DataTableProps<T>) {
	const { page, pageSize, totalCount, onPageChange } = pagination;
	const totalPages = Math.ceil(totalCount / pageSize);
	const hasActions = Boolean(onView || onEdit || onDelete);

	return (
		<div className="space-y-3">
			<div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
				<div className="flex items-center gap-5 border-b px-5 py-4 text-sm">
					<span>
						<strong>{data.length}</strong> itens
					</span>
					<span>
						<strong>{totalCount}</strong> registro{totalCount !== 1 ? "s" : ""}
					</span>
				</div>
				<table className="w-full text-sm">
					<thead>
						<tr>
							{columns.map((col) => (
								<th
									key={String(col.key)}
									className={cn(
										"px-5 py-4 font-semibold text-muted-foreground",
										alignClass[col.align ?? "left"],
									)}
								>
									{col.header}
								</th>
							))}
							{hasActions && (
								<th className="w-28 px-5 py-4 text-right font-semibold text-muted-foreground">
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
										<td key={String(col.key)} className="px-5 py-4">
											<div className="h-4 bg-muted animate-pulse rounded" />
										</td>
									))}
									{hasActions && (
										<td className="px-5 py-4">
											<div className="h-4 bg-muted animate-pulse rounded" />
										</td>
									)}
								</tr>
							))
						) : data.length === 0 ? (
							<tr className="border-t">
								<td
									colSpan={columns.length + (hasActions ? 1 : 0)}
									className="px-5 py-12 text-center text-muted-foreground"
								>
									Nenhum registro encontrado.
								</td>
							</tr>
						) : (
							data.map((row) => (
								<tr
									key={row.id}
									className="border-t hover:bg-muted/30 transition-colors"
								>
									{columns.map((col) => (
										<td
											key={String(col.key)}
											className={cn("px-5 py-4", alignClass[col.align ?? "left"])}
										>
											{col.render
												? col.render(row)
												: String(
														(row as Record<string, unknown>)[
															col.key as string
														] ?? "",
													)}
										</td>
									))}
									{hasActions && (
										<td className="px-5 py-4">
											<div className="flex justify-end gap-2">
												{onView && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => onView(row)}
														title="Visualizar"
														className="h-9 w-9 text-foreground hover:bg-muted"
													>
														<Eye className="h-4 w-4" />
													</Button>
												)}
												{onEdit && (canEdit?.(row) ?? true) && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => onEdit(row)}
														title="Editar"
														className="h-9 w-9 text-foreground hover:bg-muted"
													>
														<Pencil className="h-4 w-4" />
													</Button>
												)}
												{onDelete && (canDelete?.(row) ?? true) && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => onDelete(row)}
														title="Excluir"
														className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
				<div className="flex items-center justify-between border-t px-5 py-4 text-sm text-muted-foreground">
					<span>
						Página {page} de {totalPages} — {totalCount} registro
						{totalCount !== 1 ? "s" : ""}
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
