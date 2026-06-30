import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DatePicker } from "../../components/DatePicker";
import { QuantityInput } from "../../components/QuantityInput";
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
import { SearchableSelect } from "../../components/SearchableSelect";
import APIService from "../../services/api";
import {
	type AlimentoSelectOption,
	type CreateMovimentacaoBody,
	type Medida,
	todayISO,
} from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

interface FormState {
	idAlimento: string;
	tamanho: Medida | null;
	quantidade: number | null;
	batch: string;
	expiry: string;
}

const empty: FormState = {
	idAlimento: "",
	tamanho: null,
	quantidade: null,
	batch: "",
	expiry: "",
};

export function PerishableFormDialog({ open, onOpenChange, onSuccess }: Props) {
	const [form, setForm] = useState<FormState>(empty);
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({});
	const [loading, setLoading] = useState(false);
	const [alimentos, setAlimentos] = useState<AlimentoSelectOption[]>([]);

	useEffect(() => {
		if (!open) return;
		setForm({ ...empty });
		setErrors({});
		APIService.getRequest<AlimentoSelectOption[]>({
			url: "/itens/select",
			params: { tipo: "Alimento" },
		})
			.then(setAlimentos)
			.catch(() => toast.error("Erro ao carregar os gêneros de alimento."));
	}, [open]);

	const alimentoSelecionado = alimentos.find(
		(a) => String(a.value) === form.idAlimento,
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const next: typeof errors = {};
		if (!alimentoSelecionado) next.idAlimento = "Selecione o alimento";
		// O tamanho já é validado/normalizado pelo QuantityInput (modo medida).
		if (alimentoSelecionado && !form.tamanho)
			next.tamanho = "Informe um tamanho válido";
		if (form.quantidade === null) next.quantidade = "Qtd inválida";
		if (!form.expiry) next.expiry = "Informe a validade";
		setErrors(next);
		if (Object.keys(next).length > 0 || !form.tamanho || !alimentoSelecionado)
			return;

		setLoading(true);
		try {
			const movBody: CreateMovimentacaoBody = {
				idItem: Number(form.idAlimento),
				tamanhoValor: form.tamanho.valor,
				tamanhoUnidade: form.tamanho.unidade,
				tipoOperacao: "Entrada",
				quantidade: form.quantidade as number,
				origemTipo: "Ajuste",
				validade: form.expiry || null,
				lote: form.batch.trim() || null,
			};
			await APIService.postRequest({ url: "/movimentacoes", body: movBody });

			toast.success("Entrada registrada com sucesso!");
			onOpenChange(false);
			onSuccess();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			if (status === 422) {
				toast.error(
					"Nenhuma paróquia selecionada. Selecione uma paróquia antes de continuar.",
				);
			} else {
				toast.error("Erro ao registrar entrada. Tente novamente.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Entrada de estoque</DialogTitle>
					<DialogDescription>
						Registre pacotes que entraram no estoque.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="alimento">Alimento</Label>
						<SearchableSelect
							value={form.idAlimento ? Number(form.idAlimento) : null}
							onChange={(v) =>
								setForm({
									...form,
									idAlimento: v != null ? String(v) : "",
									tamanho: null,
								})
							}
							options={alimentos.map((a) => ({
								value: a.value,
								label: a.label,
							}))}
							placeholder="Selecione o gênero"
							searchPlaceholder="Buscar gênero..."
							emptyMessage="Nenhum gênero encontrado."
						/>
						{errors.idAlimento && (
							<p className="text-xs font-medium text-destructive">
								{errors.idAlimento}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="tamanho">Tamanho do pacote</Label>
						{alimentoSelecionado ? (
							<QuantityInput
								id="tamanho"
								mode="medida"
								forma={alimentoSelecionado.formaMedida}
								value={form.tamanho}
								onChange={(v) => setForm((f) => ({ ...f, tamanho: v }))}
								aria-invalid={!!errors.tamanho}
							/>
						) : (
							<Input
								id="tamanho"
								disabled
								placeholder="Selecione o alimento primeiro"
							/>
						)}
						{errors.tamanho && (
							<p className="text-xs font-medium text-destructive">
								{errors.tamanho}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="quantity">Qtd. de pacotes</Label>
							<QuantityInput
								id="quantity"
								mode="count"
								value={form.quantidade}
								onChange={(v) => setForm((f) => ({ ...f, quantidade: v }))}
								aria-invalid={!!errors.quantidade}
							/>
							{errors.quantidade && (
								<p className="text-xs font-medium text-destructive">
									{errors.quantidade}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="expiry">Validade</Label>
							<DatePicker
								id="expiry"
								value={form.expiry}
								onChange={(iso) => setForm((f) => ({ ...f, expiry: iso }))}
								aria-invalid={!!errors.expiry}
							/>
							{errors.expiry && (
								<p className="text-xs font-medium text-destructive">
									{errors.expiry}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="batch">Lote (opcional)</Label>
						<Input
							id="batch"
							value={form.batch}
							onChange={(e) => setForm({ ...form, batch: e.target.value })}
							placeholder="Ex.: L2024-0521"
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

export { todayISO };
