import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { QuantityInput } from "../../components/QuantityInput";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	MOTIVOS_SAIDA_ESTOQUE,
	type OrigemMovimentacao,
} from "../EstoqueAlimentos/interface";
import APIService from "../../services/api";
import type { RoupaEstoqueItem, CreateMovimentacaoBody } from "./interface";

interface Props {
	item: RoupaEstoqueItem | null;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function SaidaRoupaDialog({ item, onOpenChange, onSuccess }: Props) {
	const [motivo, setMotivo] = useState<OrigemMovimentacao>("Descarte");
	const [quantidade, setQuantidade] = useState<number | null>(1);
	const [observacao, setObservacao] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!item) return;
		setMotivo("Descarte");
		setQuantidade(1);
		setObservacao("");
	}, [item]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!item) return;
		const q = quantidade ?? 0;
		if (!(q > 0)) {
			toast.error("Quantidade inválida.");
			return;
		}
		if (q > item.quantidade) {
			toast.error(`Saldo disponível: ${item.quantidade} peça(s).`);
			return;
		}
		setLoading(true);
		try {
			const body: CreateMovimentacaoBody = {
				idItem: item.idItem,
				lote: item.lote,
				tipoOperacao: "Saida",
				quantidade: q,
				origemTipo: motivo,
				observacao: observacao.trim() || null,
			};
			await APIService.postRequest({ url: "/movimentacoes", body });
			toast.success("Saída registrada!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Saldo insuficiente para a saída."
					: "Erro ao registrar a saída. Tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={!!item} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar saída</DialogTitle>
					<DialogDescription>
						{item && (
							<>
								{item.descricao}
								{item.tamanho && <> · tam. {item.tamanho}</>}
								{item.lote && <> · lote {item.lote}</>}
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Motivo</Label>
						<Select
							value={motivo}
							onValueChange={(v) => setMotivo(v as OrigemMovimentacao)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MOTIVOS_SAIDA_ESTOQUE.map((m) => (
									<SelectItem key={m.value} value={m.value}>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="qtd-saida-roupa">Qtd. de peças</Label>
						<QuantityInput
							id="qtd-saida-roupa"
							mode="count"
							max={item?.quantidade}
							value={quantidade}
							onChange={setQuantidade}
						/>
						{item && (
							<p className="text-xs text-muted-foreground">
								Disponível: {item.quantidade} peça(s).
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="obs-saida-roupa">Observação (opcional)</Label>
						<Textarea
							id="obs-saida-roupa"
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
							{loading ? "Salvando..." : "Registrar saída"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
