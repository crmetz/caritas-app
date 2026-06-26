import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	Plus,
	PackageOpen,
	ArrowLeft,
	ArrowUpDown,
	AlertTriangle,
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
import {
	PerishablesFilters,
	ALL_VALUE,
	type PerishablesFiltersState,
} from "./filters";
import { PerishableFormDialog } from "./modal";
import { SaidaEstoqueDialog } from "./saida";
import {
	daysUntil,
	formatDateBR,
	getExpiryStatus,
	type AlimentoEstoqueItem,
	type ExpiryStatus,
	type ResumoTipoAlimento,
} from "./interface";
import { cn } from "../../lib/utils";
import APIService, { type PagedResponse } from "../../services/api";

type SortKey = "expiry" | "descricao" | "atualizacao";
type SortDir = "asc" | "desc";

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

function PerishablesPage() {
	const [items, setItems] = useState<AlimentoEstoqueItem[]>([]);
	const [resumo, setResumo] = useState<ResumoTipoAlimento[]>([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<PerishablesFiltersState>({
		search: "",
		expiryFrom: "",
		expiryTo: "",
	});
	const [formOpen, setFormOpen] = useState(false);
	const [saidaItem, setSaidaItem] = useState<AlimentoEstoqueItem | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>("expiry");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	const fetchItems = async () => {
		setLoading(true);
		try {
			const data = await APIService.getRequest<
				PagedResponse<AlimentoEstoqueItem>
			>({
				url: "/estoque/alimentos",
				params: { page: 1, pageSize: 100 },
			});
			setItems(data.items);
		} catch {
			// silently keep previous items on error; user can retry via add/reload
		} finally {
			setLoading(false);
		}
		try {
			const r = await APIService.getRequest<ResumoTipoAlimento[]>({
				url: "/estoque/alimentos/resumo",
			});
			setResumo(r);
		} catch {
			// resumo é complementar; mantém o anterior em caso de erro
		}
	};

	useEffect(() => {
		fetchItems();
	}, []);

	const filtered = useMemo(() => {
		const q = filters.search.trim().toLowerCase();
		const list = items.filter((it) => {
			const expiry = it.validade ?? "";
			if (filters.expiryFrom && expiry && expiry < filters.expiryFrom)
				return false;
			if (filters.expiryTo && expiry && expiry > filters.expiryTo) return false;
			if (q) {
				const hay = `${it.descricao} ${it.lote ?? ""}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
		const keyOf = (i: AlimentoEstoqueItem) =>
			sortKey === "expiry"
				? (i.validade ?? "")
				: sortKey === "atualizacao"
					? i.atualizadoEm
					: i.descricao.toLowerCase();
		return list.sort((a, b) => {
			const cmp = keyOf(a).localeCompare(keyOf(b));
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [items, filters, sortKey, sortDir]);

	const vencidosCount = filtered.filter(
		(i) => i.validade && getExpiryStatus(i.validade) === "expired",
	).length;
	const proximosCount = filtered.filter((i) => {
		if (!i.validade) return false;
		const s = getExpiryStatus(i.validade);
		return s === "critical" || s === "warning";
	}).length;

	const openAdd = () => {
		setFormOpen(true);
	};

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	return (
		<main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Link
							to="/"
							className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Voltar
						</Link>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
							Estoque Alimentos
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Controle de validade, lote e tamanho dos pacotes em estoque.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={openAdd}>
							<Plus className="mr-1.5 h-4 w-4" />
							Adicionar item
						</Button>
					</div>
				</div>

				{vencidosCount > 0 && (
					<div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
						<p className="text-foreground">
							<span className="font-semibold text-destructive">
								{vencidosCount}
							</span>{" "}
							{vencidosCount === 1 ? "item vencido" : "itens vencidos"} — retire
							do estoque o quanto antes.
						</p>
					</div>
				)}

				{proximosCount > 0 && (
					<div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
						<Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
						<p className="text-foreground">
							<span className="font-semibold text-warning">
								{proximosCount}
							</span>{" "}
							{proximosCount === 1
								? "item próximo do vencimento"
								: "itens próximos do vencimento"}{" "}
							— priorize o uso nas próximas cestas.
						</p>
					</div>
				)}

				{resumo.length > 0 && (
					<div>
						<h2 className="mb-2 text-sm font-semibold text-foreground">
							Resumo por alimento
						</h2>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
							{resumo.map((r) => (
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
							))}
						</div>
					</div>
				)}

				<PerishablesFilters filters={filters} onChange={setFilters} />

				<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<p className="text-sm text-muted-foreground">
							<span className="font-medium text-foreground">
								{filtered.length}
							</span>{" "}
							{filtered.length === 1 ? "item" : "itens"}
						</p>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
							<p className="text-sm text-muted-foreground">Carregando...</p>
						</div>
					) : filtered.length === 0 ? (
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
									{filtered.map((item) => {
										const status = item.validade
											? getExpiryStatus(item.validade)
											: null;
										const days = item.validade
											? daysUntil(item.validade)
											: null;
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
				</div>
			</div>

			<PerishableFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={fetchItems}
			/>

			<SaidaEstoqueDialog
				item={saidaItem}
				onOpenChange={(open) => !open && setSaidaItem(null)}
				onSuccess={fetchItems}
			/>
		</main>
	);
}

export default PerishablesPage;
