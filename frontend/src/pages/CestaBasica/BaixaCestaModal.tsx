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
import APIService from "../../services/api";
import {
	MOTIVOS_BAIXA_CESTA,
	type CestaBaixaBody,
	type LoteCesta,
	type MotivoBaixaCesta,
} from "./interface";

interface Props {
	lote: LoteCesta | null;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function BaixaCestaModal({ lote, onOpenChange, onSuccess }: Props) {
	const [motivo, setMotivo] = useState<MotivoBaixaCesta>("Transferida");
	const [quantidade, setQuantidade] = useState<number | null>(1);
	const [observacao, setObservacao] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!lote) return;
		setMotivo("Transferida");
		setQuantidade(1);
		setObservacao("");
	}, [lote]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!lote) return;
		const q = quantidade ?? 0;
		if (!(q > 0)) {
			toast.error("Quantidade inválida.");
			return;
		}
		if (q > lote.quantidadeDisponivel) {
			toast.error(`Saldo disponível: ${lote.quantidadeDisponivel} cesta(s).`);
			return;
		}
		setLoading(true);
		try {
			const body: CestaBaixaBody = {
				motivo,
				quantidade: q,
				observacao: observacao.trim() || null,
			};
			await APIService.postRequest({
				url: `/lotes-cesta/${lote.id}/baixas`,
				body,
			});
			toast.success("Movimentação registrada!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Saldo insuficiente para a movimentação."
					: "Erro ao registrar a movimentação.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={!!lote} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar movimentação</DialogTitle>
					<DialogDescription>
						{lote && (
							<>
								{lote.origem === "Montagem"
									? (lote.nomeConfiguracao ?? "Cesta montada")
									: `Recebida de ${lote.nomeDoador ?? "—"}`}{" "}
								· saldo {lote.quantidadeDisponivel}
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Motivo</Label>
						<Select
							value={motivo}
							onValueChange={(v) => setMotivo(v as MotivoBaixaCesta)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MOTIVOS_BAIXA_CESTA.map((m) => (
									<SelectItem key={m.value} value={m.value}>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							Entregas a famílias são registradas em “Entregas”.
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="qtd-baixa">Quantidade de cestas</Label>
						<QuantityInput
							id="qtd-baixa"
							mode="count"
							max={lote?.quantidadeDisponivel}
							value={quantidade}
							onChange={setQuantidade}
						/>
						{lote && (
							<p className="text-xs text-muted-foreground">
								Disponível: {lote.quantidadeDisponivel} cesta(s).
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="obs-baixa">Observação (opcional)</Label>
						<Textarea
							id="obs-baixa"
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
