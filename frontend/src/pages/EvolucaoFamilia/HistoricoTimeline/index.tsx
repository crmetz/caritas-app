import {
	Banknote,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	Package,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SITUACAO_COLOR, SITUACAO_LABEL } from "@/components/EvolucaoChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DESTINO_LABELS } from "@/pages/Caixa/interface";
import APIService, {
	getErrorMessage,
	type PagedResponse,
} from "@/services/api";
import type {
	EntregaDetalhe,
	EventoHistorico,
	TipoEventoHistorico,
} from "../interface";

const PAGE_SIZE = 20;

const ICONES: Record<TipoEventoHistorico, typeof Package> = {
	Atendimento: ClipboardList,
	Entrega: Package,
	SaidaCaixa: Banknote,
};

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatCurrency(value: number) {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "3 cestas · 5 itens", omitindo a parte que veio zerada. */
function resumoEntrega(evento: EventoHistorico) {
	const partes: string[] = [];
	if (evento.qtdCestas) {
		partes.push(
			`${evento.qtdCestas} ${evento.qtdCestas === 1 ? "cesta" : "cestas"}`,
		);
	}
	if (evento.qtdItens) {
		partes.push(
			`${evento.qtdItens} ${evento.qtdItens === 1 ? "item" : "itens"}`,
		);
	}
	return partes.length > 0 ? partes.join(" · ") : "Sem linhas";
}

export function HistoricoTimeline({ familiaId }: { familiaId: string }) {
	const [eventos, setEventos] = useState<EventoHistorico[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);

	// Detalhe das entregas, carregado sob demanda e mantido em cache ao fechar/reabrir.
	const [expandidas, setExpandidas] = useState<Record<number, boolean>>({});
	const [detalhes, setDetalhes] = useState<Record<number, EntregaDetalhe>>({});
	const [carregandoDetalhe, setCarregandoDetalhe] = useState<number | null>(
		null,
	);

	const load = useCallback(
		async (pagina: number) => {
			setLoading(true);
			try {
				const result = await APIService.getRequest<
					PagedResponse<EventoHistorico>
				>({
					url: `/familias/${familiaId}/historico`,
					params: { page: pagina, pageSize: PAGE_SIZE },
				});
				setEventos((anteriores) =>
					pagina === 1 ? result.items : [...anteriores, ...result.items],
				);
				setTotalCount(result.totalCount);
				setPage(pagina);
			} catch (e) {
				toast.error(
					getErrorMessage(e, "Erro ao carregar histórico da família."),
				);
			} finally {
				setLoading(false);
			}
		},
		[familiaId],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const toggleEntrega = async (idEntrega: number) => {
		const abrindo = !expandidas[idEntrega];
		setExpandidas((atual) => ({ ...atual, [idEntrega]: abrindo }));
		if (!abrindo || detalhes[idEntrega]) return;

		setCarregandoDetalhe(idEntrega);
		try {
			const detalhe = await APIService.getRequest<EntregaDetalhe>({
				url: `/entregas/${idEntrega}`,
			});
			setDetalhes((atual) => ({ ...atual, [idEntrega]: detalhe }));
		} catch (e) {
			toast.error(getErrorMessage(e, "Erro ao carregar detalhe da entrega."));
			setExpandidas((atual) => ({ ...atual, [idEntrega]: false }));
		} finally {
			setCarregandoDetalhe(null);
		}
	};

	const temMais = eventos.length < totalCount;

	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<h3 className="mb-3 text-sm font-semibold">Histórico da família</h3>

			{eventos.length === 0 ? (
				<p className="py-6 text-center text-sm text-muted-foreground">
					{loading
						? "Carregando…"
						: "Nenhum registro no histórico desta família."}
				</p>
			) : (
				<ol className="space-y-3">
					{eventos.map((evento) => {
						const Icone = ICONES[evento.tipo];
						const expandida = !!expandidas[evento.id];
						const detalhe = detalhes[evento.id];

						return (
							<li
								key={`${evento.tipo}-${evento.id}`}
								className="flex gap-3 border-l-2 border-border pl-4"
							>
								<Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-sm font-medium">
											{formatDate(evento.data)}
										</span>

										{evento.tipo === "Atendimento" && (
											<>
												<Badge variant="outline" className="font-normal">
													Atendimento
												</Badge>
												{evento.situacaoGeral && (
													<Badge
														style={{
															backgroundColor:
																SITUACAO_COLOR[evento.situacaoGeral],
														}}
														className="text-white"
													>
														{SITUACAO_LABEL[evento.situacaoGeral]}
													</Badge>
												)}
												{evento.rendaFamiliarMomento != null && (
													<span className="text-xs text-muted-foreground">
														Renda: {formatCurrency(evento.rendaFamiliarMomento)}
													</span>
												)}
											</>
										)}

										{evento.tipo === "Entrega" && (
											<>
												<Badge
													variant="outline"
													className="border-success/25 bg-success/10 font-normal text-success"
												>
													Entrega
												</Badge>
												<span className="text-xs text-muted-foreground">
													{resumoEntrega(evento)}
												</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
													disabled={carregandoDetalhe === evento.id}
													onClick={() => toggleEntrega(evento.id)}
												>
													{expandida ? (
														<ChevronDown className="h-3.5 w-3.5" />
													) : (
														<ChevronRight className="h-3.5 w-3.5" />
													)}
													{carregandoDetalhe === evento.id
														? "Carregando…"
														: expandida
															? "Ocultar"
															: "Detalhar"}
												</Button>
											</>
										)}

										{evento.tipo === "SaidaCaixa" && (
											<>
												<Badge
													variant="outline"
													className="border-destructive/25 bg-destructive/10 font-normal text-destructive"
												>
													Saída de caixa
												</Badge>
												{evento.destino && (
													<Badge variant="secondary" className="text-xs">
														{DESTINO_LABELS[evento.destino]}
													</Badge>
												)}
												{evento.valor != null && (
													<span className="text-sm font-medium tabular-nums text-destructive">
														−{formatCurrency(evento.valor)}
													</span>
												)}
											</>
										)}
									</div>

									{evento.descricao && (
										<p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
											{evento.descricao}
										</p>
									)}
									{evento.responsavel && (
										<p className="mt-1 text-xs text-muted-foreground">
											Responsável: {evento.responsavel}
										</p>
									)}

									{evento.tipo === "Entrega" && expandida && detalhe && (
										<div className="mt-2 space-y-1 rounded-lg border bg-muted/40 p-3 text-xs">
											{detalhe.cestas.length === 0 &&
												detalhe.itens.length === 0 && (
													<p className="text-muted-foreground">
														Nenhuma linha registrada nesta entrega.
													</p>
												)}
											{detalhe.cestas.map((cesta) => (
												<div
													key={`cesta-${cesta.idLoteCesta}`}
													className="flex justify-between gap-3"
												>
													<span className="text-foreground">
														{cesta.nomeConfiguracao ?? "Cesta doada"}
														<span className="text-muted-foreground">
															{" "}
															(lote #{cesta.idLoteCesta})
														</span>
													</span>
													<span className="tabular-nums text-muted-foreground">
														{cesta.quantidade}{" "}
														{cesta.quantidade === 1 ? "cesta" : "cestas"}
													</span>
												</div>
											))}
											{detalhe.itens.map((item) => (
												<div
													key={`item-${item.id}`}
													className="flex justify-between gap-3"
												>
													<span className="text-foreground">
														{item.descricao ?? "Item"}
														{item.lote && (
															<span className="text-muted-foreground">
																{" "}
																(lote {item.lote})
															</span>
														)}
													</span>
													<span className="tabular-nums text-muted-foreground">
														{item.quantidade.toLocaleString("pt-BR")}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							</li>
						);
					})}
				</ol>
			)}

			{temMais && (
				<div
					className={cn("flex justify-center", eventos.length > 0 && "mt-4")}
				>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={loading}
						onClick={() => load(page + 1)}
					>
						{loading ? "Carregando…" : "Carregar mais"}
					</Button>
				</div>
			)}
		</div>
	);
}
