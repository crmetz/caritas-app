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
import APIService from "../../services/api";
import type { RoupaEstoqueItem, CreateMovimentacaoBody } from "./interface";

interface Props {
	item: RoupaEstoqueItem | null;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EntradaLoteRoupaDialog({ item, onOpenChange, onSuccess }: Props) {
	const [quantidade, setQuantidade] = useState<number | null>(1);
	const [observacao, setObservacao] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!item) return;
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
		setLoading(true);
		try {
			const body: CreateMovimentacaoBody = {
				idItem: item.idItem,
				lote: item.lote,
				tipoOperacao: "Entrada",
				quantidade: q,
				origemTipo: "Ajuste",
				observacao: observacao.trim() || null,
			};
			await APIService.postRequest({ url: "/movimentacoes", body });
			toast.success("Entrada registrada!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Nenhuma paróquia selecionada. Selecione uma paróquia antes de continuar."
					: "Erro ao registrar a entrada. Tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={!!item} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Adicionar ao lote</DialogTitle>
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
						<Label htmlFor="qtd-entrada-roupa">Qtd. de peças</Label>
						<QuantityInput
							id="qtd-entrada-roupa"
							mode="count"
							value={quantidade}
							onChange={setQuantidade}
						/>
						{item && (
							<p className="text-xs text-muted-foreground">
								Saldo atual: {item.quantidade} peça(s).
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="obs-entrada-roupa">Observação (opcional)</Label>
						<Textarea
							id="obs-entrada-roupa"
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
							{loading ? "Salvando..." : "Registrar entrada"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
