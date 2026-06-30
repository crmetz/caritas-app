import { useCallback, useEffect, useRef, useState } from "react";
import {
	Plus,
	PackageOpen,
	ArrowUpDown,
	PackageMinus,
	PackagePlus,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
	ClothingFilters,
	ALL_VALUE,
	type ClothingFiltersState,
} from "./filters";
import { ClothingFormDialog } from "./modal";
import { SaidaRoupaDialog } from "./saida";
import { EntradaLoteRoupaDialog } from "./entradaLote";
import {
	getConditionBadgeVariant,
	CATEGORIAS_LABEL,
	type RoupaEstoqueItem,
	type CategoriaRoupa,
	type CondicaoRoupa,
} from "./interface";
import { cn } from "../../lib/utils";
import APIService, { type PagedResponse } from "../../services/api";

type SortKey = "descricao" | "quantidade" | "categoria";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export function EstoqueRoupasTab() {
	const [items, setItems] = useState<RoupaEstoqueItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<ClothingFiltersState>({
		search: "",
		categoria: ALL_VALUE,
		condicao: ALL_VALUE,
	});
	const [page, setPage] = useState(1);
	const [formOpen, setFormOpen] = useState(false);
	const [saidaItem, setSaidaItem] = useState<RoupaEstoqueItem | null>(null);
	const [entradaItem, setEntradaItem] = useState<RoupaEstoqueItem | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>("descricao");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	// Ignora respostas obsoletas de buscas concorrentes (só a requisição mais recente aplica).
	const reqIdRef = useRef(0);

	const fetchItems = useCallback(async () => {
		const reqId = ++reqIdRef.current;
		setLoading(true);
		try {
			const data = await APIService.getRequest<PagedResponse<RoupaEstoqueItem>>(
				{
					url: "/estoque/roupas",
					params: {
						page,
						pageSize: PAGE_SIZE,
						busca: filters.search.trim() || undefined,
						categoria:
							filters.categoria !== ALL_VALUE ? filters.categoria : undefined,
						condicao:
							filters.condicao !== ALL_VALUE ? filters.condicao : undefined,
						sortKey,
						sortDir,
					},
				},
			);
			if (reqId !== reqIdRef.current) return;
			setItems(data.items);
			setTotalCount(data.totalCount);
		} catch {
			// silently keep previous items on error
		} finally {
			if (reqId === reqIdRef.current) setLoading(false);
		}
	}, [page, filters, sortKey, sortDir]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	// Filtros e ordenação resetam para a primeira página (atualizações em lote → um único fetch).
	const handleFiltersChange = (next: ClothingFiltersState) => {
		setFilters(next);
		setPage(1);
	};

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
		setPage(1);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-muted-foreground">
					Controle de quantidade, categoria e condição das roupas em estoque.
				</p>
				<Button onClick={() => setFormOpen(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					Adicionar item
				</Button>
			</div>

			<ClothingFilters filters={filters} onChange={handleFiltersChange} />

			<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<p className="text-sm text-muted-foreground">
						<span className="font-medium text-foreground">{totalCount}</span>{" "}
						{totalCount === 1 ? "item" : "itens"}
					</p>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
						<p className="text-sm text-muted-foreground">Carregando...</p>
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
							<PackageOpen className="h-6 w-6 text-muted-foreground" />
						</div>
						<p className="text-sm font-medium text-foreground">
							Nenhum item encontrado
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Ajuste os filtros ou adicione um novo item.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-4">
										<button
											type="button"
											onClick={() => toggleSort("descricao")}
											className="inline-flex items-center gap-1 hover:text-foreground"
										>
											Nome
											<ArrowUpDown
												className={cn(
													"h-3 w-3",
													sortKey === "descricao"
														? "text-foreground"
														: "text-muted-foreground/60",
												)}
											/>
										</button>
									</TableHead>
									<TableHead>
										<button
											type="button"
											onClick={() => toggleSort("categoria")}
											className="inline-flex items-center gap-1 hover:text-foreground"
										>
											Categoria
											<ArrowUpDown
												className={cn(
													"h-3 w-3",
													sortKey === "categoria"
														? "text-foreground"
														: "text-muted-foreground/60",
												)}
											/>
										</button>
									</TableHead>
									<TableHead>Tamanho</TableHead>
									<TableHead>Condição</TableHead>
									<TableHead className="text-right">
										<button
											type="button"
											onClick={() => toggleSort("quantidade")}
											className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
										>
											Quantidade
											<ArrowUpDown
												className={cn(
													"h-3 w-3",
													sortKey === "quantidade"
														? "text-foreground"
														: "text-muted-foreground/60",
												)}
											/>
										</button>
									</TableHead>
									<TableHead className="pr-4 text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => {
									const badge = item.condicao
										? getConditionBadgeVariant(item.condicao as CondicaoRoupa)
										: null;
									return (
										<TableRow key={item.id}>
											<TableCell className="pl-4">
												<div className="font-medium text-foreground">
													{item.descricao}
												</div>
												{item.lote && (
													<div className="text-xs text-muted-foreground">
														Lote {item.lote}
													</div>
												)}
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">
													{CATEGORIAS_LABEL[item.categoria as CategoriaRoupa] ??
														item.categoria}
												</span>
											</TableCell>
											<TableCell>
												<span className="text-sm text-muted-foreground">
													{item.tamanho ?? "—"}
												</span>
											</TableCell>
											<TableCell>
												{badge ? (
													<Badge
														variant="outline"
														className={cn("font-normal", badge.className)}
													>
														{badge.label}
													</Badge>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="text-right tabular-nums text-foreground">
												{item.quantidade.toLocaleString("pt-BR")}
											</TableCell>
											<TableCell className="pr-4 text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setEntradaItem(item)}
													>
														<PackagePlus className="mr-1.5 h-4 w-4" />
														Adicionar
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setSaidaItem(item)}
													>
														<PackageMinus className="mr-1.5 h-4 w-4" />
														Saída
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				{totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-border px-4 py-3">
						<p className="text-sm text-muted-foreground">
							Página {page} de {totalPages}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								<ChevronLeft className="h-4 w-4" />
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								Próxima
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			<ClothingFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={fetchItems}
			/>

			<EntradaLoteRoupaDialog
				item={entradaItem}
				onOpenChange={(open) => !open && setEntradaItem(null)}
				onSuccess={fetchItems}
			/>

			<SaidaRoupaDialog
				item={saidaItem}
				onOpenChange={(open) => !open && setSaidaItem(null)}
				onSuccess={fetchItems}
			/>
		</div>
	);
}
