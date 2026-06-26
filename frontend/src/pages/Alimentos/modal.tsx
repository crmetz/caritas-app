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
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import APIService from "../../services/api";
import type {
	Alimento,
	CreateAlimentoBody,
	FormaMedida,
} from "../EstoqueAlimentos/interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	editing: Alimento | null;
}

const FORMAS: FormaMedida[] = ["Peso", "Volume", "Unidade"];

export function AlimentoFormDialog({
	open,
	onOpenChange,
	onSuccess,
	editing,
}: Props) {
	const [descricao, setDescricao] = useState("");
	const [formaMedida, setFormaMedida] = useState<FormaMedida>("Peso");
	const [erro, setErro] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setDescricao(editing?.descricao ?? "");
		setFormaMedida(editing?.formaMedida ?? "Peso");
		setErro(null);
	}, [open, editing]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!descricao.trim()) {
			setErro("Informe o nome do alimento");
			return;
		}
		setLoading(true);
		try {
			const body: CreateAlimentoBody = {
				descricao: descricao.trim(),
				formaMedida,
			};
			if (editing) {
				await APIService.putRequest({
					url: `/itens/alimentos/${editing.id}`,
					body,
				});
			} else {
				await APIService.postRequest({ url: "/itens/alimentos", body });
			}
			toast.success(editing ? "Alimento atualizado!" : "Alimento cadastrado!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			toast.error(
				status === 422
					? "Já existe um alimento com esse nome."
					: "Erro ao salvar. Tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Editar alimento" : "Novo alimento"}
					</DialogTitle>
					<DialogDescription>
						Gênero alimentício e como ele é medido.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="descricao">Nome</Label>
						<Input
							id="descricao"
							value={descricao}
							onChange={(e) => setDescricao(e.target.value)}
							placeholder="Ex.: Arroz, Feijão, Óleo"
							aria-invalid={!!erro}
						/>
						{erro && (
							<p className="text-xs font-medium text-destructive">{erro}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="forma">Forma de medida</Label>
						<Select
							value={formaMedida}
							onValueChange={(v) => setFormaMedida(v as FormaMedida)}
						>
							<SelectTrigger id="forma">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FORMAS.map((f) => (
									<SelectItem key={f} value={f}>
										{f}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
