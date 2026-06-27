import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table";
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
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [origem, setOrigem] = useState<string>(ALL_VALUE);
	const [tipo, setTipo] = useState<string>(ALL_VALUE);

	const fetchItems = useCallback(async () => {
		setLoading(true);
		try {
			const data = await APIService.getRequest<
				PagedResponse<MovimentacaoHistorico>
			>({
				url: "/movimentacoes",
				params: {
					page,
					pageSize: PAGE_SIZE,
					tipoItem: tipo !== ALL_VALUE ? tipo : undefined,
					origemTipo: origem !== ALL_VALUE ? origem : undefined,
				},
			});
			setItems(data.items);
			setTotalCount(data.totalCount);
		} catch {
			// mantém os itens anteriores em caso de erro
		} finally {
			setLoading(false);
		}
	}, [page, origem, tipo]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-muted-foreground">
					Todas as entradas e saídas de estoque, da mais recente para a mais
					antiga.
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<Label
						htmlFor="tipo-historico"
						className="text-xs text-muted-foreground"
					>
						Tipo
					</Label>
					<Select
						value={tipo}
						onValueChange={(v) => {
							setTipo(v);
							setPage(1);
						}}
					>
						<SelectTrigger
							id="tipo-historico"
							className="w-36"
							aria-label="Tipo"
						>
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

					<Label
						htmlFor="origem-historico"
						className="text-xs text-muted-foreground"
					>
						Origem
					</Label>
					<Select
						value={origem}
						onValueChange={(v) => {
							setOrigem(v);
							setPage(1);
						}}
					>
						<SelectTrigger
							id="origem-historico"
							className="w-48"
							aria-label="Origem"
						>
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

			<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<p className="text-sm text-muted-foreground">
						<span className="font-medium text-foreground">{totalCount}</span>{" "}
						{totalCount === 1 ? "movimentação" : "movimentações"}
					</p>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
						<p className="text-sm text-muted-foreground">Carregando...</p>
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
							<History className="h-6 w-6 text-muted-foreground" />
						</div>
						<p className="text-sm font-medium text-foreground">
							Nenhuma movimentação encontrada
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							As entradas e saídas de estoque aparecerão aqui.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-4">Data</TableHead>
									<TableHead>Item</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead className="text-right">Quantidade</TableHead>
									<TableHead>Origem</TableHead>
									<TableHead className="pr-4">Lote</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((m) => {
									const entrada = m.tipoOperacao === "Entrada";
									return (
										<TableRow key={m.id}>
											<TableCell className="pl-4 tabular-nums text-muted-foreground">
												{formatDateTimeBR(m.criadoEm)}
											</TableCell>
											<TableCell>
												<div className="font-medium text-foreground">
													{m.descricao ?? "—"}
												</div>
												{m.tipoItem && (
													<div className="text-xs text-muted-foreground">
														{m.tipoItem}
													</div>
												)}
											</TableCell>
											<TableCell>
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
											</TableCell>
											<TableCell className="text-right tabular-nums text-foreground">
												{entrada ? "+" : "−"}
												{m.quantidade.toLocaleString("pt-BR")}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{ORIGEM_LABEL[m.origemTipo] ?? m.origemTipo}
											</TableCell>
											<TableCell className="pr-4 text-muted-foreground">
												{m.lote ?? "—"}
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
		</div>
	);
}
