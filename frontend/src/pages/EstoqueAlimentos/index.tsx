import { useCallback, useEffect, useRef, useState } from "react";
import {
	Plus,
	PackageOpen,
	ArrowUpDown,
	AlertTriangle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Clock,
	PackageMinus,
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
import { PerishablesFilters, type PerishablesFiltersState } from "./filters";
import { PerishableFormDialog } from "./modal";
import { SaidaEstoqueDialog } from "./saida";
import {
	daysUntil,
	formatDateBR,
	getExpiryStatus,
	type AlimentoEstoqueItem,
	type EstoqueAlertas,
	type ExpiryStatus,
	type ResumoTipoAlimento,
} from "./interface";
import { cn } from "../../lib/utils";
import APIService, { type PagedResponse } from "../../services/api";

type SortKey = "expiry" | "descricao" | "atualizacao";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<ExpiryStatus, { label: string; className: string }> =
	{
		expired: {
			label: "Vencido",
			className: "bg-destructive/15 text-destructive border-destructive/30",
		},
		critical: {
			label: "Crítico",
			className: "bg-destructive/10 text-destructive border-destructive/25",
		},
		warning: {
			label: "Atenção",
			className: "bg-warning/15 text-warning border-warning/30",
		},
		ok: {
			label: "Ok",
			className: "bg-success/10 text-success border-success/25",
		},
	};

export function EstoqueAlimentosTab() {
	const [items, setItems] = useState<AlimentoEstoqueItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [resumo, setResumo] = useState<ResumoTipoAlimento[]>([]);
	const [alertas, setAlertas] = useState<EstoqueAlertas>({
		vencidos: 0,
		proximos: 0,
	});
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<PerishablesFiltersState>({
		search: "",
		expiryFrom: "",
		expiryTo: "",
	});
	const [page, setPage] = useState(1);
	const [formOpen, setFormOpen] = useState(false);
	const [saidaItem, setSaidaItem] = useState<AlimentoEstoqueItem | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>("expiry");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [resumoExpandido, setResumoExpandido] = useState(false);
	// Nº de colunas do grid do resumo (espelha grid-cols-2 / sm:3 / lg:5) para mostrar só a 1ª linha.
	const [colunasResumo, setColunasResumo] = useState(() =>
		typeof window === "undefined"
			? 5
			: window.innerWidth >= 1024
				? 5
				: window.innerWidth >= 640
					? 3
					: 2,
	);

	// Ignora respostas obsoletas: com buscas concorrentes (ex.: fetch inicial + busca logo após),
	// só a requisição mais recente aplica seu resultado.
	const reqIdRef = useRef(0);

	// Lista server-side (busca + filtro de validade + ordenação + paginação), padrão das Roupas.
	const fetchItems = useCallback(async () => {
		const reqId = ++reqIdRef.current;
		setLoading(true);
		try {
			const data = await APIService.getRequest<
				PagedResponse<AlimentoEstoqueItem>
			>({
				url: "/estoque/alimentos",
				params: {
					page,
					pageSize: PAGE_SIZE,
					busca: filters.search.trim() || undefined,
					validadeDe: filters.expiryFrom || undefined,
					validadeAte: filters.expiryTo || undefined,
					sortKey,
					sortDir,
				},
			});
			if (reqId !== reqIdRef.current) return;
			setItems(data.items);
			setTotalCount(data.totalCount);
		} catch {
			// mantém os itens anteriores em caso de erro
		} finally {
			if (reqId === reqIdRef.current) setLoading(false);
		}
	}, [page, filters, sortKey, sortDir]);

	// Resumo por gênero e alertas de validade são agregados server-side (independem da paginação).
	const fetchAgregados = useCallback(async () => {
		try {
			const [r, a] = await Promise.all([
				APIService.getRequest<ResumoTipoAlimento[]>({
					url: "/estoque/alimentos/resumo",
				}),
				APIService.getRequest<EstoqueAlertas>({
					url: "/estoque/alimentos/alertas",
				}),
			]);
			setResumo(r);
			setAlertas(a);
		} catch {
			// agregados são complementares; mantém os anteriores em caso de erro
		}
	}, []);

	const refresh = () => {
		fetchItems();
		fetchAgregados();
	};

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	useEffect(() => {
		fetchAgregados();
	}, [fetchAgregados]);

	useEffect(() => {
		const sm = window.matchMedia("(min-width: 640px)");
		const lg = window.matchMedia("(min-width: 1024px)");
		const atualizar = () =>
			setColunasResumo(lg.matches ? 5 : sm.matches ? 3 : 2);
		atualizar();
		sm.addEventListener("change", atualizar);
		lg.addEventListener("change", atualizar);
		return () => {
			sm.removeEventListener("change", atualizar);
			lg.removeEventListener("change", atualizar);
		};
	}, []);

	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	const openAdd = () => {
		setFormOpen(true);
	};

	const handleFiltersChange = (next: PerishablesFiltersState) => {
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
					Controle de validade, lote e tamanho dos pacotes em estoque.
				</p>
				<Button onClick={openAdd}>
					<Plus className="mr-1.5 h-4 w-4" />
					Adicionar item
				</Button>
			</div>

			{alertas.vencidos > 0 && (
				<div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
					<p className="text-foreground">
						<span className="font-semibold text-destructive">
							{alertas.vencidos}
						</span>{" "}
						{alertas.vencidos === 1 ? "item vencido" : "itens vencidos"} —
						retire do estoque o quanto antes.
					</p>
				</div>
			)}

			{alertas.proximos > 0 && (
				<div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
					<Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
					<p className="text-foreground">
						<span className="font-semibold text-warning">
							{alertas.proximos}
						</span>{" "}
						{alertas.proximos === 1
							? "item próximo do vencimento"
							: "itens próximos do vencimento"}{" "}
						— priorize o uso nas próximas cestas.
					</p>
				</div>
			)}

			{resumo.length > 0 && (
				<div>
					<div className="mb-2 flex items-center justify-between gap-2">
						<h2 className="text-sm font-semibold text-foreground">
							Resumo por alimento
						</h2>
						{/* Por padrão mostra só a primeira linha (colunasResumo cards); o restante
						    fica atrás do "Ver todos". */}
						{resumo.length > colunasResumo && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setResumoExpandido((v) => !v)}
							>
								{resumoExpandido ? (
									<>
										Ver menos
										<ChevronUp className="ml-1 h-4 w-4" />
									</>
								) : (
									<>
										Ver todos ({resumo.length})
										<ChevronDown className="ml-1 h-4 w-4" />
									</>
								)}
							</Button>
						)}
					</div>
					<div
						data-testid="resumo-alimentos"
						className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
					>
						{(resumoExpandido ? resumo : resumo.slice(0, colunasResumo)).map(
							(r) => (
								<div
									key={r.idAlimento}
									className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-soft)]"
								>
									<p className="truncate text-xs font-medium text-muted-foreground">
										{r.nome}
									</p>
									<p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
										{r.textoFormatado}
									</p>
								</div>
							),
						)}
					</div>
				</div>
			)}

			<PerishablesFilters filters={filters} onChange={handleFiltersChange} />

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
											Nome / Lote
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
									<TableHead>Tamanho</TableHead>
									<TableHead className="text-right">Pacotes</TableHead>
									<TableHead>
										<button
											type="button"
											onClick={() => toggleSort("expiry")}
											className="inline-flex items-center gap-1 hover:text-foreground"
										>
											Validade
											<ArrowUpDown
												className={cn(
													"h-3 w-3",
													sortKey === "expiry"
														? "text-foreground"
														: "text-muted-foreground/60",
												)}
											/>
										</button>
									</TableHead>
									<TableHead>
										<button
											type="button"
											onClick={() => toggleSort("atualizacao")}
											className="inline-flex items-center gap-1 hover:text-foreground"
										>
											Última atualização
											<ArrowUpDown
												className={cn(
													"h-3 w-3",
													sortKey === "atualizacao"
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
									const status = item.validade
										? getExpiryStatus(item.validade)
										: null;
									const days = item.validade ? daysUntil(item.validade) : null;
									const badge = status ? STATUS_BADGE[status] : null;
									return (
										<TableRow
											key={item.id}
											className={cn(
												status === "expired" && "bg-destructive/5",
												status === "critical" && "bg-destructive/[0.03]",
											)}
										>
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
											<TableCell className="text-foreground">
												{item.tamanhoFormatado ?? "—"}
											</TableCell>
											<TableCell className="text-right tabular-nums text-foreground">
												{item.quantidade.toLocaleString("pt-BR")}
											</TableCell>
											<TableCell>
												{item.validade && badge ? (
													<div className="flex flex-col gap-0.5">
														<span className="tabular-nums font-medium text-foreground">
															{formatDateBR(item.validade)}
														</span>
														<Badge
															variant="outline"
															className={cn(
																"w-fit font-normal",
																badge.className,
															)}
														>
															{status === "expired"
																? `Vencido há ${Math.abs(days!)}d`
																: status === "ok"
																	? badge.label
																	: `${badge.label} · ${days}d`}
														</Badge>
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{formatDateBR(item.atualizadoEm.slice(0, 10))}
											</TableCell>
											<TableCell className="pr-4 text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSaidaItem(item)}
												>
													<PackageMinus className="mr-1.5 h-4 w-4" />
													Saída
												</Button>
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
			<PerishableFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={refresh}
			/>

			<SaidaEstoqueDialog
				item={saidaItem}
				onOpenChange={(open) => !open && setSaidaItem(null)}
				onSuccess={refresh}
			/>
		</div>
	);
}
