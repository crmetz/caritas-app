import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Clock,
	PackageMinus,
	Plus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import APIService, { type PagedResponse } from "../../services/api";
import { PerishablesFilters, type PerishablesFiltersState } from "./filters";
import {
	daysUntil,
	formatDateBR,
	getExpiryStatus,
	type AlimentoEstoqueItem,
	type EstoqueAlertas,
	type ExpiryStatus,
	type ResumoTipoAlimento,
} from "./interface";
import { PerishableFormDialog } from "./modal";
import { SaidaEstoqueDialog } from "./saida";

type SortKey = "expiry" | "descricao" | "atualizacao";

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
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
	const reqIdRef = useRef(0);

	// Lista server-side (busca + filtro de validade + ordenação + paginação).
	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<
					PagedResponse<AlimentoEstoqueItem>
				>({
					url: "/estoque/alimentos",
					params: {
						page: pageToLoad,
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
				setPage(pageToLoad);
			} catch {
				// mantém os itens anteriores em caso de erro
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[filters, sortKey, sortDir],
	);

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
		load(page);
		fetchAgregados();
	};

	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load]);

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

	const toggleSort = (key: string) => {
		const k = key as SortKey;
		if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(k);
			setSortDir("asc");
		}
	};

	const columns: Column<AlimentoEstoqueItem>[] = [
		{
			key: "descricao",
			header: "Nome / Lote",
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
			key: "tamanhoFormatado",
			header: "Tamanho",
			render: (item) => item.tamanhoFormatado ?? "—",
		},
		{
			key: "quantidade",
			header: "Pacotes",
			align: "right",
			render: (item) => item.quantidade.toLocaleString("pt-BR"),
		},
		{
			key: "validade",
			header: "Validade",
			sortKey: "expiry",
			render: (item) => {
				const status = item.validade ? getExpiryStatus(item.validade) : null;
				const days = item.validade ? daysUntil(item.validade) : null;
				const badge = status ? STATUS_BADGE[status] : null;
				if (!item.validade || !badge)
					return <span className="text-muted-foreground">—</span>;
				return (
					<div className="flex flex-col gap-0.5">
						<span className="tabular-nums font-medium text-foreground">
							{formatDateBR(item.validade)}
						</span>
						<Badge
							variant="outline"
							className={cn("w-fit font-normal", badge.className)}
						>
							{status === "expired"
								? `Vencido há ${Math.abs(days!)}d`
								: status === "ok"
									? badge.label
									: `${badge.label} · ${days}d`}
						</Badge>
					</div>
				);
			},
		},
		{
			key: "atualizadoEm",
			header: "Última atualização",
			sortKey: "atualizacao",
			render: (item) => (
				<span className="tabular-nums text-muted-foreground">
					{formatDateBR(item.atualizadoEm.slice(0, 10))}
				</span>
			),
		},
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (item) => (
				<Button variant="ghost" size="sm" onClick={() => setSaidaItem(item)}>
					<PackageMinus className="mr-1.5 h-4 w-4" />
					Saída
				</Button>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-muted-foreground">
					Controle de validade, lote e tamanho dos pacotes em estoque.
				</p>
				<Button onClick={() => setFormOpen(true)}>
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

			<PerishablesFilters
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
				rowClassName={(item) => {
					const status = item.validade ? getExpiryStatus(item.validade) : null;
					if (status === "expired") return "bg-destructive/5";
					if (status === "critical") return "bg-destructive/[0.03]";
					return "";
				}}
			/>

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
