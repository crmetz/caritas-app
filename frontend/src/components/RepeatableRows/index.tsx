import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RepeatableRowsProps } from "./interface";

// Fluxo único e reutilizável de adição de itens em linha. Regra central: não é possível adicionar uma
// nova linha enquanto a última não estiver completa (isRowComplete) — evita linhas vazias em sequência.
export function RepeatableRows<T>({
	rows,
	onChange,
	newRow,
	isRowComplete,
	renderRow,
	addLabel = "Adicionar item",
	minRows = 1,
	className,
}: RepeatableRowsProps<T>) {
	// Atualizações funcionais: aplicam sobre o array atual, não sobre um snapshot
	// capturado em closure (evita que callbacks atrasados revertam linhas recém-adicionadas).
	const update = (index: number, patch: Partial<T>) => {
		onChange((prev) =>
			prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
		);
	};

	const remove = (index: number) => {
		onChange((prev) => prev.filter((_, i) => i !== index));
	};

	const add = () => onChange((prev) => [...prev, newRow()]);

	const lastRow = rows[rows.length - 1];
	const canAdd = rows.length === 0 || (!!lastRow && isRowComplete(lastRow));

	return (
		<div className={cn("space-y-3", className)}>
			{rows.map((row, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: linhas não possuem id estável.
				<div key={index} className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						{renderRow(row, index, (patch) => update(index, patch))}
					</div>
					{rows.length > minRows && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="mt-0.5 shrink-0"
							onClick={() => remove(index)}
							aria-label="Remover linha"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					)}
				</div>
			))}

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={add}
				disabled={!canAdd}
			>
				<Plus className="h-4 w-4" />
				{addLabel}
			</Button>
		</div>
	);
}
