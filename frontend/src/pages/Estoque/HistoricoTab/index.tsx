import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "../../../components/DataTable";
import type { Column } from "../../../components/DataTable/interface";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { cn } from "../../../lib/utils";
import APIService, { type PagedResponse } from "../../../services/api";
import {
	ORIGENS,
	ORIGEM_LABEL,
	TIPOS_ITEM,
	TIPOS_OPERACAO,
	type MovimentacaoHistorico,
} from "./interface";

const PAGE_SIZE = 10;
const ALL_VALUE = "all";

function formatDateTimeBR(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function HistoricoTab() {
	const [items, setItems] = useState<MovimentacaoHistorico[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [genero, setGenero] = useState<string>(ALL_VALUE);
	const [tipo, setTipo] = useState<string>(ALL_VALUE);
	const [origem, setOrigem] = useState<string>(ALL_VALUE);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [loading, setLoading] = useState(false);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<
					PagedResponse<MovimentacaoHistorico>
				>({
					url: "/movimentacoes",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						tipoItem: genero !== ALL_VALUE ? genero : undefined,
						tipoOperacao: tipo !== ALL_VALUE ? tipo : undefined,
						origemTipo: origem !== ALL_VALUE ? origem : undefined,
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
		[genero, tipo, origem, sortDir],
	);

	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load]);

	const columns: Column<MovimentacaoHistorico>[] = [
		{
			key: "criadoEm",
			header: "Data",
			sortKey: "data",
			render: (m) => (
				<span className="tabular-nums text-muted-foreground">
					{formatDateTimeBR(m.criadoEm)}
				</span>
			),
		},
		{
			key: "descricao",
			header: "Item",
			render: (m) => (
				<div>
					<div className="font-medium text-foreground">
						{m.descricao ?? "—"}
					</div>
					{m.tipoItem && (
						<div className="text-xs text-muted-foreground">{m.tipoItem}</div>
					)}
				</div>
			),
		},
		{
			key: "tipoOperacao",
			header: "Tipo",
			render: (m) => {
				const entrada = m.tipoOperacao === "Entrada";
				return (
					<Badge
						variant="outline"
						className={cn(
							"font-normal",
							entrada
								? "border-success/25 bg-success/10 text-success"
								: "border-destructive/25 bg-destructive/10 text-destructive",
						)}
					>
						{entrada ? "Entrada" : "Saída"}
					</Badge>
				);
			},
		},
		{
			key: "quantidade",
			header: "Quantidade",
			align: "right",
			render: (m) => (
				<span className="tabular-nums text-foreground">
					{m.tipoOperacao === "Entrada" ? "+" : "−"}
					{m.quantidade.toLocaleString("pt-BR")}
				</span>
			),
		},
		{
			key: "origemTipo",
			header: "Origem",
			render: (m) => ORIGEM_LABEL[m.origemTipo] ?? m.origemTipo,
		},
		{
			key: "lote",
			header: "Lote",
			render: (m) => m.lote ?? "—",
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-end gap-3">
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Gênero</Label>
					<Select
						value={genero}
						onValueChange={(v) => {
							setGenero(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-40" aria-label="Gênero">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_VALUE}>Todos</SelectItem>
							{TIPOS_ITEM.map((t) => (
								<SelectItem key={t} value={t}>
									{t}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Tipo</Label>
					<Select
						value={tipo}
						onValueChange={(v) => {
							setTipo(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-40" aria-label="Tipo">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_VALUE}>Todos</SelectItem>
							{TIPOS_OPERACAO.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Origem</Label>
					<Select
						value={origem}
						onValueChange={(v) => {
							setOrigem(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-48" aria-label="Origem">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_VALUE}>Todas</SelectItem>
							{ORIGENS.map((o) => (
								<SelectItem key={o} value={o}>
									{ORIGEM_LABEL[o]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={items}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{
					sortKey: "data",
					sortDir,
					onSort: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
				}}
				isLoading={loading}
			/>
		</div>
	);
}
