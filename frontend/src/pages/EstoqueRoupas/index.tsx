import { PackageMinus, PackagePlus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import APIService, { type PagedResponse } from "../../services/api";
import { EntradaLoteRoupaDialog } from "./entradaLote";
import {
	ALL_VALUE,
	ClothingFilters,
	type ClothingFiltersState,
} from "./filters";
import {
	CATEGORIAS_LABEL,
	type CategoriaRoupa,
	type CondicaoRoupa,
	getConditionBadgeVariant,
	type RoupaEstoqueItem,
} from "./interface";
import { ClothingFormDialog } from "./modal";
import { SaidaRoupaDialog } from "./saida";

const PAGE_SIZE = 10;

type SortKey = "descricao" | "quantidade" | "categoria";

export function EstoqueRoupasTab() {
	const [items, setItems] = useState<RoupaEstoqueItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState<ClothingFiltersState>({
		search: "",
		categoria: ALL_VALUE,
		condicao: ALL_VALUE,
	});
	const [sortKey, setSortKey] = useState<SortKey>("descricao");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [saidaItem, setSaidaItem] = useState<RoupaEstoqueItem | null>(null);
	const [entradaItem, setEntradaItem] = useState<RoupaEstoqueItem | null>(null);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<
					PagedResponse<RoupaEstoqueItem>
				>({
					url: "/estoque/roupas",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: filters.search.trim() || undefined,
						categoria:
							filters.categoria !== ALL_VALUE ? filters.categoria : undefined,
						condicao:
							filters.condicao !== ALL_VALUE ? filters.condicao : undefined,
						sortKey,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setItems(data.items);
				setTotalCount(data.totalCount);
				setPage(pageToLoad);
			} catch {
				// silently keep previous items on error
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[filters, sortKey, sortDir],
	);

	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load]);

	const toggleSort = (key: string) => {
		const k = key as SortKey;
		if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(k);
			setSortDir("asc");
		}
	};

	const columns: Column<RoupaEstoqueItem>[] = [
		{
			key: "descricao",
			header: "Nome",
			sortKey: "descricao",
			render: (item) => (
				<div>
					<div className="font-medium text-foreground">{item.descricao}</div>
					{item.lote && (
						<div className="text-xs text-muted-foreground">
							Lote {item.lote}
						</div>
					)}
				</div>
			),
		},
		{
			key: "categoria",
			header: "Categoria",
			sortKey: "categoria",
			render: (item) =>
				CATEGORIAS_LABEL[item.categoria as CategoriaRoupa] ?? item.categoria,
		},
		{
			key: "tamanho",
			header: "Tamanho",
			render: (item) => item.tamanho ?? "—",
		},
		{
			key: "condicao",
			header: "Condição",
			render: (item) => {
				const badge = item.condicao
					? getConditionBadgeVariant(item.condicao as CondicaoRoupa)
					: null;
				return badge ? (
					<Badge
						variant="outline"
						className={cn("font-normal", badge.className)}
					>
						{badge.label}
					</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			key: "quantidade",
			header: "Quantidade",
			align: "right",
			sortKey: "quantidade",
			render: (item) => item.quantidade.toLocaleString("pt-BR"),
		},
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (item) => (
				<div className="flex items-center justify-end gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setEntradaItem(item)}
					>
						<PackagePlus className="mr-1.5 h-4 w-4" />
						Adicionar
					</Button>
					<Button variant="ghost" size="sm" onClick={() => setSaidaItem(item)}>
						<PackageMinus className="mr-1.5 h-4 w-4" />
						Saída
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-muted-foreground">
					Controle de quantidade, categoria e condição das roupas em estoque.
				</p>
				<Button onClick={() => setFormOpen(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					Adicionar item
				</Button>
			</div>

			<ClothingFilters
				filters={filters}
				onChange={(next) => {
					setFilters(next);
					setPage(1);
				}}
			/>

			<DataTable
				columns={columns}
				data={items}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{ sortKey, sortDir, onSort: toggleSort }}
				isLoading={loading}
			/>

			<ClothingFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={() => load(page)}
			/>

			<EntradaLoteRoupaDialog
				item={entradaItem}
				onOpenChange={(open) => !open && setEntradaItem(null)}
				onSuccess={() => load(page)}
			/>

			<SaidaRoupaDialog
				item={saidaItem}
				onOpenChange={(open) => !open && setSaidaItem(null)}
				onSuccess={() => load(page)}
			/>
		</div>
	);
}
