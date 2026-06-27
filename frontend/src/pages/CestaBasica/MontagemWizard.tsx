import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { QuantityInput } from "../../components/QuantityInput";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import APIService, { type PagedResponse } from "../../services/api";
import { cn } from "../../lib/utils";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import type {
	AlocacaoConfirmada,
	ConfiguracaoCesta,
	MontagemConfirmarBody,
	MontagemProposta,
} from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function MontagemWizard({ open, onOpenChange, onSuccess }: Props) {
	const [configs, setConfigs] = useState<ConfiguracaoCesta[]>([]);
	const [configId, setConfigId] = useState("");
	const [quantidade, setQuantidade] = useState<number | null>(1);
	const [proposta, setProposta] = useState<MontagemProposta | null>(null);
	// quantidades por [linha][lote]
	const [qty, setQty] = useState<number[][]>([]);
	const [step, setStep] = useState<1 | 2>(1);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		setConfigId("");
		setQuantidade(1);
		setProposta(null);
		setQty([]);
		setStep(1);
		APIService.getRequest<PagedResponse<ConfiguracaoCesta>>({
			url: "/configuracoes-cesta",
			params: { page: 1, pageSize: 100 },
		})
			.then((d) => setConfigs(d.items))
			.catch(() => toast.error("Erro ao carregar configurações."));
	}, [open]);

	const simular = async () => {
		const q = quantidade ?? 0;
		if (!configId || !(q > 0)) {
			toast.error("Selecione a cesta e a quantidade.");
			return;
		}
		setLoading(true);
		try {
			const p = await APIService.postRequest<MontagemProposta>({
				url: "/montagens-cesta/simular",
				body: { idConfiguracaoCesta: Number(configId), quantidade: q },
			});
			setProposta(p);
			setQty(p.linhas.map((l) => l.lotesDisponiveis.map((d) => d.qtdSugerida)));
			setStep(2);
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Selecione uma paróquia antes de continuar."
					: "Erro ao simular a montagem.",
			);
		} finally {
			setLoading(false);
		}
	};

	const setLoteQty = (li: number, di: number, valor: number) => {
		const max = proposta?.linhas[li].lotesDisponiveis[di].saldo ?? 0;
		const v = Math.max(0, Math.min(max, valor || 0));
		setQty((prev) =>
			prev.map((linha, i) =>
				i === li ? linha.map((x, j) => (j === di ? v : x)) : linha,
			),
		);
	};

	const somaLinha = (li: number) => (qty[li] ?? []).reduce((s, x) => s + x, 0);

	const tudoFechado = useMemo(() => {
		if (!proposta) return false;
		return proposta.linhas.every(
			(l, li) => somaLinha(li) === l.pacotesNecessarios,
		);
	}, [proposta, qty]);

	const confirmar = async () => {
		if (!proposta) return;
		const alocacoes: AlocacaoConfirmada[] = proposta.linhas.flatMap((l, li) =>
			l.lotesDisponiveis
				.map((d, di) => ({ d, q: qty[li]?.[di] ?? 0 }))
				.filter((x) => x.q > 0)
				.map((x) => ({
					idAlimento: l.idAlimento,
					tamanho: l.tamanho,
					validade: x.d.validade,
					lote: x.d.lote,
					qtdPacotes: x.q,
				})),
		);
		if (alocacoes.length === 0) {
			toast.error("Nenhum pacote alocado.");
			return;
		}
		setSaving(true);
		try {
			const body: MontagemConfirmarBody = {
				idConfiguracaoCesta: proposta.idConfiguracaoCesta,
				quantidade: proposta.quantidade,
				alocacoes,
			};
			await APIService.postRequest({ url: "/montagens-cesta", body });
			toast.success(`${proposta.quantidade} cesta(s) montada(s)!`);
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Saldo insuficiente para a montagem."
					: "Erro ao confirmar a montagem.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Montar cestas</DialogTitle>
					<DialogDescription>
						{step === 1
							? "Escolha a configuração e quantas cestas montar."
							: "Revise os pacotes propostos — troque validades ou combine lotes; a quantidade por item é fixa."}
					</DialogDescription>
				</DialogHeader>

				{step === 1 && (
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label>Configuração de cesta</Label>
							<Select value={configId} onValueChange={setConfigId}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione a cesta" />
								</SelectTrigger>
								<SelectContent>
									{configs.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="qtd-montar">Qtd. de cestas</Label>
							<QuantityInput
								id="qtd-montar"
								mode="count"
								value={quantidade}
								onChange={setQuantidade}
							/>
						</div>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancelar
							</Button>
							<Button onClick={simular} disabled={loading}>
								{loading ? "Calculando..." : "Continuar"}
							</Button>
						</DialogFooter>
					</div>
				)}

				{step === 2 && proposta && (
					<div className="space-y-4">
						{proposta.linhas.map((linha, li) => {
							const soma = somaLinha(li);
							const fechado = soma === linha.pacotesNecessarios;
							return (
								<div
									key={linha.idAlimento}
									className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
								>
									<div className="mb-2 flex items-center justify-between">
										<div>
											<span className="font-medium text-foreground">
												{linha.nomeAlimento}
											</span>{" "}
											<span className="text-sm text-muted-foreground">
												({linha.tamanhoFormatado}/pacote)
											</span>
										</div>
										<div className="text-sm text-muted-foreground">
											Necessário:{" "}
											<span className="font-medium text-foreground">
												{linha.pacotesNecessarios}
											</span>
											<Badge
												variant="outline"
												className={cn(
													"ml-2 font-normal",
													fechado
														? "border-success/30 bg-success/10 text-success"
														: "border-warning/30 bg-warning/15 text-warning",
												)}
											>
												Alocado {soma}
											</Badge>
										</div>
									</div>
									<div className="space-y-1.5">
										{linha.lotesDisponiveis.length === 0 && (
											<p className="text-sm text-muted-foreground">
												Sem lotes em estoque.
											</p>
										)}
										{linha.lotesDisponiveis.map((d, di) => (
											<div
												key={di}
												className={cn(
													"flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
													d.vencido
														? "border-destructive/30 bg-destructive/5"
														: "border-border",
												)}
											>
												<span className="min-w-0 flex-1 truncate text-foreground">
													{d.validade ? (
														<>Validade {formatDateBR(d.validade)}</>
													) : (
														<>Sem validade</>
													)}
													{d.lote && (
														<span className="text-muted-foreground">
															{" "}
															· Lote {d.lote}
														</span>
													)}
													<span className="text-muted-foreground">
														{" "}
														· saldo {d.saldo}
													</span>
													{d.vencido && (
														<Badge
															variant="outline"
															className="ml-2 border-destructive/30 bg-destructive/10 text-destructive"
														>
															Vencido
														</Badge>
													)}
												</span>
												<QuantityInput
													className="w-20"
													mode="count"
													min={0}
													max={d.saldo}
													value={qty[li]?.[di] ?? 0}
													onChange={(v) => setLoteQty(li, di, v ?? 0)}
												/>
											</div>
										))}
									</div>
									{!fechado && (
										<p className="mt-2 text-xs text-warning">
											Aloque exatamente {linha.pacotesNecessarios} pacote(s)
											{soma > linha.pacotesNecessarios
												? " (excedente)"
												: ` (faltam ${linha.pacotesNecessarios - soma})`}
											.
										</p>
									)}
								</div>
							);
						})}

						{!tudoFechado && (
							<div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
								<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
								<p className="text-foreground">
									Ajuste as alocações até que cada item feche a quantidade
									necessária. Se faltar estoque, registre entradas antes de
									montar.
								</p>
							</div>
						)}

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(1)}
								disabled={saving}
							>
								Voltar
							</Button>
							<Button onClick={confirmar} disabled={saving || !tudoFechado}>
								{saving ? "Confirmando..." : "Confirmar montagem"}
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
