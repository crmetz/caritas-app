import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { QuantityInput } from "../../components/QuantityInput";
import { RepeatableRows } from "../../components/RepeatableRows";
import { SearchableSelect } from "../../components/SearchableSelect";
import type { SearchableSelectOption } from "../../components/SearchableSelect/interface";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import APIService, { type PagedResponse } from "../../services/api";
import {
	type AlimentoEstoqueItem,
	baseUnidade,
	formatDateBR,
} from "../EstoqueAlimentos/interface";
import type { RoupaEstoqueItem } from "../EstoqueRoupas/interface";
import {
	type EntregaBody,
	type EntregaCestaLinha,
	type EntregaItemLinha,
	type LinhaCestaForm,
	type LinhaItemForm,
	type LoteOption,
	type ModoLinha,
	novaLinhaCesta,
	novaLinhaItem,
	type PosicaoEstoque,
} from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const cestaCompleta = (l: LinhaCestaForm) =>
	l.idLote !== null && l.quantidade !== null && l.quantidade > 0;
const itemCompleto = (l: LinhaItemForm) =>
	l.idPosicao !== null && l.quantidade !== null && l.quantidade > 0;

export function NovaEntregaModal({ open, onOpenChange, onSuccess }: Props) {
	const [modo, setModo] = useState<ModoLinha>("Cestas");
	const [familias, setFamilias] = useState<SearchableSelectOption[]>([]);
	const [idFamilia, setIdFamilia] = useState<number | null>(null);
	const [lotes, setLotes] = useState<LoteOption[]>([]);
	const [posicoes, setPosicoes] = useState<PosicaoEstoque[]>([]);
	const [linhasCesta, setLinhasCesta] = useState<LinhaCestaForm[]>([
		novaLinhaCesta(),
	]);
	const [linhasAlimento, setLinhasAlimento] = useState<LinhaItemForm[]>([
		novaLinhaItem(),
	]);
	const [linhasRoupa, setLinhasRoupa] = useState<LinhaItemForm[]>([
		novaLinhaItem(),
	]);
	const [observacao, setObservacao] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setModo("Cestas");
		setIdFamilia(null);
		setLinhasCesta([novaLinhaCesta()]);
		setLinhasAlimento([novaLinhaItem()]);
		setLinhasRoupa([novaLinhaItem()]);
		setObservacao("");

		APIService.getRequest<{ value: number; label: string | null }[]>({
			url: "/familias/select",
		})
			.then((fs) =>
				setFamilias(fs.map((f) => ({ value: f.value, label: f.label ?? "—" }))),
			)
			.catch(() => toast.error("Erro ao carregar famílias."));

		APIService.getRequest<LoteOption[]>({ url: "/lotes-cesta/select" })
			.then(setLotes)
			.catch(() => toast.error("Erro ao carregar cestas disponíveis."));

		Promise.all([
			APIService.getRequest<PagedResponse<AlimentoEstoqueItem>>({
				url: "/estoque/alimentos",
				params: { page: 1, pageSize: 100 },
			}),
			APIService.getRequest<PagedResponse<RoupaEstoqueItem>>({
				url: "/estoque/roupas",
				params: { page: 1, pageSize: 100 },
			}),
		])
			.then(([alimentos, roupas]) => {
				const ali: PosicaoEstoque[] = alimentos.items
					.filter((a) => a.quantidade > 0)
					.map((a) => ({
						id: a.id,
						idItem: a.idItem,
						kind: "alimento",
						formaMedida: a.formaMedida,
						tamanhoBase: a.tamanho,
						validade: a.validade,
						lote: a.lote,
						disponivel: a.quantidade,
						label:
							`${a.descricao}` +
							(a.tamanhoFormatado ? ` · ${a.tamanhoFormatado}` : "") +
							(a.validade ? ` · venc ${formatDateBR(a.validade)}` : "") +
							(a.lote ? ` · lote ${a.lote}` : "") +
							` · ${a.quantidade} disp.`,
					}));
				const rou: PosicaoEstoque[] = roupas.items
					.filter((r) => r.quantidade > 0)
					.map((r) => ({
						id: r.id,
						idItem: r.idItem,
						kind: "roupa",
						formaMedida: null,
						tamanhoBase: null,
						validade: null,
						lote: r.lote,
						disponivel: r.quantidade,
						label:
							`${r.descricao}` +
							(r.tamanho ? ` · ${r.tamanho}` : "") +
							(r.lote ? ` · lote ${r.lote}` : "") +
							` · ${r.quantidade} disp.`,
					}));
				setPosicoes([...ali, ...rou]);
			})
			.catch(() => toast.error("Erro ao carregar o estoque."));
	}, [open]);

	const loteOptions: SearchableSelectOption[] = lotes.map((l) => ({
		value: l.idLote,
		label: l.label,
	}));
	const optionsPorTipo = (
		kind: PosicaoEstoque["kind"],
	): SearchableSelectOption[] =>
		posicoes
			.filter((p) => p.kind === kind)
			.map((p) => ({ value: p.id, label: p.label }));
	const alimentoOptions = optionsPorTipo("alimento");
	const roupaOptions = optionsPorTipo("roupa");

	// Coleta as linhas de item válidas (posição selecionada + quantidade dentro do disponível).
	// Retorna null se alguma linha exceder o saldo (já exibe o toast e aborta o submit).
	const coletarItens = (linhas: LinhaItemForm[]): EntregaItemLinha[] | null => {
		const out: EntregaItemLinha[] = [];
		for (const l of linhas) {
			if (l.idPosicao === null) continue;
			const q = l.quantidade ?? 0;
			if (!(q > 0)) continue;
			const pos = posicoes.find((p) => p.id === l.idPosicao);
			if (!pos) continue;
			if (q > pos.disponivel) {
				toast.error(
					`Item selecionado tem só ${pos.disponivel} disponível(is).`,
				);
				return null;
			}
			out.push(
				pos.kind === "alimento"
					? {
							idItem: pos.idItem,
							quantidade: q,
							tamanhoValor: pos.tamanhoBase,
							tamanhoUnidade:
								pos.tamanhoBase != null && pos.formaMedida
									? baseUnidade(pos.formaMedida)
									: null,
							validade: pos.validade,
							lote: pos.lote,
						}
					: { idItem: pos.idItem, quantidade: q, lote: pos.lote },
			);
		}
		return out;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (idFamilia === null) {
			toast.error("Selecione a família beneficiária.");
			return;
		}

		// Cestas válidas (lote selecionado + quantidade > 0, dentro do disponível).
		const cestas: EntregaCestaLinha[] = [];
		for (const l of linhasCesta) {
			if (l.idLote === null) continue;
			const q = l.quantidade ?? 0;
			if (!(q > 0)) continue;
			const lote = lotes.find((x) => x.idLote === l.idLote);
			if (lote && q > lote.disponivel) {
				toast.error(
					`Cesta selecionada tem só ${lote.disponivel} disponível(is).`,
				);
				return;
			}
			cestas.push({ idLoteCesta: l.idLote, quantidade: q });
		}

		const itensAlimento = coletarItens(linhasAlimento);
		if (itensAlimento === null) return;
		const itensRoupa = coletarItens(linhasRoupa);
		if (itensRoupa === null) return;
		const itens = [...itensAlimento, ...itensRoupa];

		if (cestas.length === 0 && itens.length === 0) {
			toast.error("Adicione ao menos uma cesta ou item.");
			return;
		}

		setLoading(true);
		try {
			const body: EntregaBody = {
				idFamilia,
				cestas,
				itens,
				observacao: observacao.trim() || null,
			};
			await APIService.postRequest({ url: "/entregas", body });
			toast.success("Entrega registrada!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Saldo insuficiente para a entrega."
					: "Erro ao registrar a entrega.",
			);
		} finally {
			setLoading(false);
		}
	};

	// Renderiza um conjunto de linhas de item (alimentos ou roupas) com seu picker filtrado.
	const renderItensTab = (
		linhas: LinhaItemForm[],
		setLinhas: Dispatch<SetStateAction<LinhaItemForm[]>>,
		options: SearchableSelectOption[],
	) => (
		<RepeatableRows
			rows={linhas}
			onChange={setLinhas}
			newRow={novaLinhaItem}
			isRowComplete={itemCompleto}
			addLabel="Adicionar item"
			renderRow={(l, _i, update) => (
				<div className="flex items-center gap-2">
					<div className="min-w-0 flex-1">
						<SearchableSelect
							value={l.idPosicao}
							onChange={(v) => update({ idPosicao: v })}
							options={options}
							placeholder="Selecione o item em estoque"
							searchPlaceholder="Buscar item..."
							emptyMessage="Nenhum item disponível."
						/>
					</div>
					<QuantityInput
						mode="count"
						className="w-24"
						value={l.quantidade}
						onChange={(v) => update({ quantidade: v })}
					/>
				</div>
			)}
		/>
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Nova entrega</DialogTitle>
					<DialogDescription>
						Cestas, alimentos e/ou roupas entregues a uma família.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Família beneficiária</Label>
						<SearchableSelect
							value={idFamilia}
							onChange={setIdFamilia}
							options={familias}
							placeholder="Selecione a família"
							searchPlaceholder="Buscar família..."
							emptyMessage="Nenhuma família encontrada."
						/>
					</div>

					<Tabs value={modo} onValueChange={(v) => setModo(v as ModoLinha)}>
						<TabsList>
							<TabsTrigger value="Cestas">Cestas</TabsTrigger>
							<TabsTrigger value="Alimentos">Alimentos</TabsTrigger>
							<TabsTrigger value="Roupas">Roupas</TabsTrigger>
						</TabsList>

						<TabsContent value="Cestas">
							<RepeatableRows
								rows={linhasCesta}
								onChange={setLinhasCesta}
								newRow={novaLinhaCesta}
								isRowComplete={cestaCompleta}
								addLabel="Adicionar cesta"
								renderRow={(l, _i, update) => (
									<div className="flex items-center gap-2">
										<div className="min-w-0 flex-1">
											<SearchableSelect
												value={l.idLote}
												onChange={(v) => update({ idLote: v })}
												options={loteOptions}
												placeholder="Selecione a cesta"
												searchPlaceholder="Buscar cesta..."
												emptyMessage="Nenhuma cesta disponível."
											/>
										</div>
										<QuantityInput
											mode="count"
											className="w-24"
											value={l.quantidade}
											onChange={(v) => update({ quantidade: v })}
										/>
									</div>
								)}
							/>
						</TabsContent>

						<TabsContent value="Alimentos">
							{renderItensTab(
								linhasAlimento,
								setLinhasAlimento,
								alimentoOptions,
							)}
						</TabsContent>

						<TabsContent value="Roupas">
							{renderItensTab(linhasRoupa, setLinhasRoupa, roupaOptions)}
						</TabsContent>
					</Tabs>

					<div className="space-y-1.5">
						<Label htmlFor="obs-entrega">Observação (opcional)</Label>
						<Textarea
							id="obs-entrega"
							value={observacao}
							onChange={(e) => setObservacao(e.target.value)}
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
						<Button type="submit" disabled={loading}>
							{loading ? "Salvando..." : "Registrar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
