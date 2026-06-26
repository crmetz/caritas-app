import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { QuantityInput } from "../../components/QuantityInput";
import type { Medida } from "../../components/QuantityInput/quantity";
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
import APIService from "../../services/api";
import type { Alimento } from "../EstoqueAlimentos/interface";
import type { ConfiguracaoCesta, ConfiguracaoCestaBody } from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	editing: ConfiguracaoCesta | null;
}

interface LinhaForm {
	idAlimento: number | null;
	tamanho: Medida | null; // medida por pacote
	pacotes: number | null; // pacotes por cesta
}

const novaLinha = (): LinhaForm => ({
	idAlimento: null,
	tamanho: null,
	pacotes: 1,
});

const linhaCompleta = (l: LinhaForm) =>
	l.idAlimento !== null &&
	l.tamanho !== null &&
	l.pacotes !== null &&
	l.pacotes > 0;

// Interpreta um tamanho já formatado pelo back-end ("1 kg", "500 g", "12 un") em Medida.
function parseFormatado(s: string): Medida | null {
	const m = s
		.trim()
		.replace(",", ".")
		.match(/^([0-9]*\.?[0-9]+)\s*([a-zA-Zµ]+)$/);
	if (!m) return null;
	return { valor: Number(m[1]), unidade: m[2] };
}

export function ConfiguracaoModal({
	open,
	onOpenChange,
	onSuccess,
	editing,
}: Props) {
	const [nome, setNome] = useState("");
	const [linhas, setLinhas] = useState<LinhaForm[]>([novaLinha()]);
	const [alimentos, setAlimentos] = useState<Alimento[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setNome(editing?.nome ?? "");
		setLinhas(
			editing && editing.itens.length > 0
				? editing.itens.map((i) => ({
						idAlimento: i.idAlimento,
						tamanho: parseFormatado(i.tamanhoFormatado),
						pacotes: i.quantidadePacotes,
					}))
				: [novaLinha()],
		);
		APIService.getRequest<Alimento[]>({ url: "/itens/alimentos" })
			.then(setAlimentos)
			.catch(() => toast.error("Erro ao carregar alimentos."));
	}, [open, editing]);

	const alimentoOptions = alimentos.map((a) => ({
		value: a.id,
		label: a.descricao,
	}));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!nome.trim()) {
			toast.error("Informe o nome da cesta.");
			return;
		}
		if (linhas.length === 0 || !linhas.every(linhaCompleta)) {
			toast.error("Preencha todas as linhas corretamente.");
			return;
		}

		const itens: ConfiguracaoCestaBody["itens"] = linhas.map((l) => ({
			idAlimento: l.idAlimento as number,
			tamanhoValor: (l.tamanho as Medida).valor,
			tamanhoUnidade: (l.tamanho as Medida).unidade,
			quantidadePacotes: l.pacotes as number,
		}));

		setLoading(true);
		try {
			const body: ConfiguracaoCestaBody = { nome: nome.trim(), itens };
			if (editing) {
				await APIService.putRequest({
					url: `/configuracoes-cesta/${editing.id}`,
					body,
				});
			} else {
				await APIService.postRequest({ url: "/configuracoes-cesta", body });
			}
			toast.success(
				editing ? "Configuração atualizada!" : "Configuração criada!",
			);
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Selecione uma paróquia antes de continuar."
					: "Erro ao salvar a configuração.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Editar configuração" : "Nova configuração de cesta"}
					</DialogTitle>
					<DialogDescription>
						Defina o que uma cesta leva: alimento, quantidade e quantos pacotes
						por cesta.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="nome">Nome</Label>
						<Input
							id="nome"
							value={nome}
							onChange={(e) => setNome(e.target.value)}
							placeholder="Ex.: Cesta A"
						/>
					</div>

					<div className="space-y-2">
						<div className="grid grid-cols-[1fr_8rem_6rem] gap-2 pr-12">
							<Label className="text-xs text-muted-foreground">Alimento</Label>
							<Label className="text-xs text-muted-foreground">
								Quantidade
							</Label>
							<Label className="text-xs text-muted-foreground">Pacotes</Label>
						</div>

						<RepeatableRows
							rows={linhas}
							onChange={setLinhas}
							newRow={novaLinha}
							isRowComplete={linhaCompleta}
							addLabel="Adicionar item"
							renderRow={(l, _i, update) => {
								const alimento = alimentos.find((a) => a.id === l.idAlimento);
								return (
									<div className="grid grid-cols-[1fr_8rem_6rem] items-center gap-2">
										<SearchableSelect
											value={l.idAlimento}
											onChange={(v) => update({ idAlimento: v, tamanho: null })}
											options={alimentoOptions}
											placeholder="Alimento"
											searchPlaceholder="Buscar alimento..."
											emptyMessage="Nenhum alimento encontrado."
										/>
										{alimento ? (
											<QuantityInput
												mode="medida"
												forma={alimento.formaMedida}
												value={l.tamanho}
												onChange={(v) => update({ tamanho: v })}
											/>
										) : (
											<Input disabled placeholder="Quantidade" />
										)}
										<QuantityInput
											mode="count"
											placeholder="Pacotes"
											value={l.pacotes}
											onChange={(v) => update({ pacotes: v })}
										/>
									</div>
								);
							}}
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
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
