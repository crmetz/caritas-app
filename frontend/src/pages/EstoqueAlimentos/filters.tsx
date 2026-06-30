import { Search, X } from "lucide-react";
import { DatePicker } from "../../components/DatePicker";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export interface PerishablesFiltersState {
	search: string;
	expiryFrom: string;
	expiryTo: string;
}

interface Props {
	filters: PerishablesFiltersState;
	onChange: (next: PerishablesFiltersState) => void;
}

export const ALL_VALUE = "all";

export function PerishablesFilters({ filters, onChange }: Props) {
	const set = <K extends keyof PerishablesFiltersState>(
		key: K,
		value: PerishablesFiltersState[K],
	) => onChange({ ...filters, [key]: value });

	const hasActive =
		filters.search !== "" ||
		filters.expiryFrom !== "" ||
		filters.expiryTo !== "";

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
							placeholder="Buscar por nome ou lote..."
							className="pl-9"
							aria-label="Buscar"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="expiryFrom" className="text-xs text-muted-foreground">
						Validade de
					</Label>
					<DatePicker
						id="expiryFrom"
						value={filters.expiryFrom}
						placeholder="Validade de"
						onChange={(iso) => set("expiryFrom", iso)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="expiryTo" className="text-xs text-muted-foreground">
						Validade até
					</Label>
					<DatePicker
						id="expiryTo"
						value={filters.expiryTo}
						placeholder="Validade até"
						onChange={(iso) => set("expiryTo", iso)}
					/>
				</div>
			</div>

			{hasActive && (
				<div className="mt-3 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							onChange({ search: "", expiryFrom: "", expiryTo: "" })
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
