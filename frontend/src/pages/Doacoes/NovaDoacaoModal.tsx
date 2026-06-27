import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DatePicker } from "../../components/DatePicker";
import { QuantityInput } from "../../components/QuantityInput";
import { RepeatableRows } from "../../components/RepeatableRows";
import { SearchableSelect } from "../../components/SearchableSelect";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
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
	type DoacaoCestaBody,
	type DoacaoItensBody,
	type ItemSelectOption,
	type LinhaItemDoacao,
	type ModoDoacao,
	novaLinhaItem,
} from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

interface DoadorRow {
	id: number;
	nome: string;
}

const linhaCompleta = (l: LinhaItemDoacao) =>
	l.idItem !== null && l.quantidade !== null && l.quantidade > 0;

export function NovaDoacaoModal({ open, onOpenChange, onSuccess }: Props) {
	const [modo, setModo] = useState<ModoDoacao>("Itens");
	const [doadores, setDoadores] = useState<{ value: number; label: string }[]>(
		[],
	);
	const [itens, setItens] = useState<ItemSelectOption[]>([]);
	const [idDoador, setIdDoador] = useState<number | null>(null);
	const [novoDoador, setNovoDoador] = useState("");
	const [observacao, setObservacao] = useState("");
	const [linhas, setLinhas] = useState<LinhaItemDoacao[]>([novaLinhaItem()]);
	const [quantidadeCestas, setQuantidadeCestas] = useState<number | null>(1);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setModo("Itens");
		setIdDoador(null);
		setNovoDoador("");
		setObservacao("");
		setLinhas([novaLinhaItem()]);
		setQuantidadeCestas(1);
		APIService.getRequest<PagedResponse<DoadorRow>>({
			url: "/doadores",
			params: { page: 1, pageSize: 100 },
		})
			.then((d) =>
				setDoadores(d.items.map((x) => ({ value: x.id, label: x.nome }))),
			)
			.catch(() => toast.error("Erro ao carregar doadores."));
		APIService.getRequest<ItemSelectOption[]>({ url: "/itens/select" })
			.then(setItens)
			.catch(() => toast.error("Erro ao carregar itens."));
	}, [open]);

	const itensOptions = itens.map((i) => ({
		value: i.value,
		label: i.label ?? "—",
	}));

	const resolverDoador = async (): Promise<number | null> => {
		if (idDoador !== null) return idDoador;
		if (novoDoador.trim()) {
			const criado = await APIService.postRequest<DoadorRow>({
				url: "/doadores",
				body: { nome: novoDoador.trim() },
			});
			return criado.id;
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const doadorId = idDoador ?? (novoDoador.trim() ? -1 : null);
		if (doadorId === null) {
			toast.error("Selecione ou informe um doador.");
			return;
		}

		if (modo === "Itens") {
			if (linhas.filter(linhaCompleta).length === 0) {
				toast.error("Adicione ao menos um item com quantidade.");
				return;
			}
		} else if (!(quantidadeCestas !== null && quantidadeCestas > 0)) {
			toast.error("Quantidade de cestas inválida.");
			return;
		}

		setLoading(true);
		try {
			const resolvedDoador = await resolverDoador();
			if (resolvedDoador === null) {
				toast.error("Selecione ou informe um doador.");
				return;
			}

			if (modo === "Itens") {
				const body: DoacaoItensBody = {
					idDoador: resolvedDoador,
					observacao: observacao.trim() || null,
					itens: linhas.filter(linhaCompleta).map((l) => ({
						idItem: l.idItem as number,
						quantidade: l.quantidade as number,
						tamanhoValor: l.tamanho?.valor ?? null,
						tamanhoUnidade: l.tamanho?.unidade ?? null,
						validade: l.validade || null,
						lote: l.lote.trim() || null,
					})),
				};
				await APIService.postRequest({ url: "/doacoes", body });
			} else {
				const body: DoacaoCestaBody = {
					idDoador: resolvedDoador,
					quantidade: quantidadeCestas as number,
					observacao: observacao.trim() || null,
				};
				await APIService.postRequest({ url: "/doacoes/cestas", body });
			}
			toast.success("Doação registrada!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Selecione uma paróquia antes de continuar."
					: "Erro ao registrar a doação.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Nova doação</DialogTitle>
					<DialogDescription>
						Itens avulsos (alimentos/roupas) ou cestas fechadas recebidas.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Doador</Label>
						<SearchableSelect
							value={idDoador}
							onChange={(v) => {
								setIdDoador(v);
								if (v !== null) setNovoDoador("");
							}}
							options={doadores}
							placeholder="Selecione um doador"
							searchPlaceholder="Buscar doador..."
							emptyMessage="Nenhum doador encontrado."
						/>
						<Input
							placeholder="ou informe um novo doador"
							value={novoDoador}
							onChange={(e) => {
								setNovoDoador(e.target.value);
								if (e.target.value) setIdDoador(null);
							}}
						/>
					</div>

					<Tabs value={modo} onValueChange={(v) => setModo(v as ModoDoacao)}>
						<TabsList>
							<TabsTrigger value="Itens">Itens avulsos</TabsTrigger>
							<TabsTrigger value="Cesta">Cesta fechada</TabsTrigger>
						</TabsList>

						<TabsContent value="Itens">
							<RepeatableRows
								rows={linhas}
								onChange={setLinhas}
								newRow={novaLinhaItem}
								isRowComplete={linhaCompleta}
								addLabel="Adicionar item"
								renderRow={(l, _i, update) => {
									const item = itens.find((it) => it.value === l.idItem);
									return (
										<div className="space-y-2 rounded-lg border border-border p-3">
											<div className="flex items-center gap-2">
												<div className="min-w-0 flex-1">
													<SearchableSelect
														value={l.idItem}
														onChange={(v) =>
															update({ idItem: v, tamanho: null })
														}
														options={itensOptions}
														placeholder="Selecione o item"
														searchPlaceholder="Buscar item..."
														emptyMessage="Nenhum item encontrado."
													/>
												</div>
												<QuantityInput
													mode="count"
													className="w-24"
													value={l.quantidade}
													onChange={(v) => update({ quantidade: v })}
												/>
											</div>
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
												{item?.formaMedida && (
													<QuantityInput
														mode="medida"
														forma={item.formaMedida}
														value={l.tamanho}
														onChange={(v) => update({ tamanho: v })}
													/>
												)}
												<DatePicker
													value={l.validade}
													placeholder="Validade"
													onChange={(iso) => update({ validade: iso })}
												/>
												<Input
													placeholder="Lote"
													value={l.lote}
													onChange={(e) => update({ lote: e.target.value })}
												/>
											</div>
										</div>
									);
								}}
							/>
						</TabsContent>

						<TabsContent value="Cesta" className="space-y-1.5">
							<Label htmlFor="qtd-cestas">Quantidade de cestas</Label>
							<QuantityInput
								mode="count"
								id="qtd-cestas"
								value={quantidadeCestas}
								onChange={setQuantidadeCestas}
							/>
						</TabsContent>
					</Tabs>

					<div className="space-y-1.5">
						<Label htmlFor="obs-doacao">Observação (opcional)</Label>
						<Textarea
							id="obs-doacao"
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
