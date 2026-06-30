import { Search, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	CATEGORIAS_ROUPA,
	CATEGORIAS_LABEL,
	CONDICOES_ROUPA,
} from "./interface";

export interface ClothingFiltersState {
	search: string;
	categoria: string;
	condicao: string;
}

interface Props {
	filters: ClothingFiltersState;
	onChange: (next: ClothingFiltersState) => void;
}

export const ALL_VALUE = "all";

export function ClothingFilters({ filters, onChange }: Props) {
	const set = <K extends keyof ClothingFiltersState>(
		key: K,
		value: ClothingFiltersState[K],
	) => onChange({ ...filters, [key]: value });

	const hasActive =
		filters.search !== "" ||
		filters.categoria !== ALL_VALUE ||
		filters.condicao !== ALL_VALUE;

	return (
		<div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Buscar</Label>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={filters.search}
							onChange={(e) => set("search", e.target.value)}
							placeholder="Pesquisar por nome..."
							className="pl-9"
							aria-label="Buscar"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Categoria</Label>
					<Select
						value={filters.categoria}
						onValueChange={(v) => set("categoria", v)}
					>
						<SelectTrigger aria-label="Categoria">
							<SelectValue placeholder="Categoria" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_VALUE}>Todas</SelectItem>
							{CATEGORIAS_ROUPA.map((c) => (
								<SelectItem key={c} value={c}>
									{CATEGORIAS_LABEL[c]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Condição</Label>
					<Select
						value={filters.condicao}
						onValueChange={(v) => set("condicao", v)}
					>
						<SelectTrigger aria-label="Condição">
							<SelectValue placeholder="Condição" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_VALUE}>Todas</SelectItem>
							{CONDICOES_ROUPA.map((c) => (
								<SelectItem key={c} value={c}>
									{c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{hasActive && (
				<div className="mt-3 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							onChange({
								search: "",
								categoria: ALL_VALUE,
								condicao: ALL_VALUE,
							})
						}
					>
						<X className="mr-1 h-3.5 w-3.5" />
						Limpar filtros
					</Button>
				</div>
			)}
		</div>
	);
}
