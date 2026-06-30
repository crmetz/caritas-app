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
import {
	CATEGORIAS_ROUPA,
	CATEGORIAS_LABEL,
	FAIXAS_ETARIAS,
	FAIXAS_LABEL,
	GENEROS,
	ESTACOES,
	ESTACOES_LABEL,
	CONDICOES_ROUPA,
	type CategoriaRoupa,
	type FaixaEtaria,
	type Genero,
	type Estacao,
	type CondicaoRoupa,
	type CreateRoupaBody,
	type CreateRoupaResponse,
	type CreateMovimentacaoBody,
} from "./interface";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

interface FormState {
	descricao: string;
	categoria: CategoriaRoupa | "";
	faixaEtaria: FaixaEtaria | "";
	genero: Genero | "";
	tamanho: string;
	estacao: Estacao | "";
	condicao: CondicaoRoupa | "";
	quantidade: number | null;
}

const empty: FormState = {
	descricao: "",
	categoria: "",
	faixaEtaria: "",
	genero: "",
	tamanho: "",
	estacao: "",
	condicao: "",
	quantidade: null,
};

const NO_VALUE = "__none__";

export function ClothingFormDialog({ open, onOpenChange, onSuccess }: Props) {
	const [form, setForm] = useState<FormState>(empty);
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open) {
			setForm({ ...empty });
			setErrors({});
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const next: typeof errors = {};

		if (!form.descricao.trim()) next.descricao = "Informe o nome";
		if (!form.categoria) next.categoria = "Selecione a categoria";

		const qty = form.quantidade ?? 0;
		if (!(qty > 0)) {
			next.quantidade = "Quantidade inválida";
		}

		setErrors(next);
		if (Object.keys(next).length > 0) return;

		setLoading(true);
		try {
			const itemBody: CreateRoupaBody = {
				descricao: form.descricao.trim(),
				categoria: form.categoria as CategoriaRoupa,
				faixaEtaria: form.faixaEtaria || null,
				genero: form.genero || null,
				tamanho: form.tamanho.trim() || null,
				estacao: form.estacao || null,
				condicao: form.condicao || null,
			};
			const created = await APIService.postRequest<CreateRoupaResponse>({
				url: "/itens/roupas",
				body: itemBody,
			});

			const movBody: CreateMovimentacaoBody = {
				idItem: created.id,
				tipoOperacao: "Entrada",
				quantidade: qty,
				origemTipo: "Ajuste",
			};
			await APIService.postRequest({ url: "/movimentacoes", body: movBody });

			toast.success("Item adicionado com sucesso!");
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
				toast.error("Erro ao adicionar item. Tente novamente.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Adicionar roupa</DialogTitle>
					<DialogDescription>Preencha os dados da roupa</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="descricao">Nome / Descrição</Label>
						<Input
							id="descricao"
							value={form.descricao}
							onChange={(e) => setForm({ ...form, descricao: e.target.value })}
							placeholder="Ex.: Camiseta branca, Calça azul"
							aria-invalid={!!errors.descricao}
						/>
						{errors.descricao && (
							<p className="text-xs font-medium text-destructive">
								{errors.descricao}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="categoria">Categoria</Label>
							<Select
								value={form.categoria}
								onValueChange={(v) =>
									setForm({ ...form, categoria: v as CategoriaRoupa })
								}
							>
								<SelectTrigger id="categoria" aria-invalid={!!errors.categoria}>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									{CATEGORIAS_ROUPA.map((c) => (
										<SelectItem key={c} value={c}>
											{CATEGORIAS_LABEL[c]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.categoria && (
								<p className="text-xs font-medium text-destructive">
									{errors.categoria}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="faixaEtaria">Faixa Etária (opcional)</Label>
							<Select
								value={form.faixaEtaria || NO_VALUE}
								onValueChange={(v) =>
									setForm({
										...form,
										faixaEtaria: v === NO_VALUE ? "" : (v as FaixaEtaria),
									})
								}
							>
								<SelectTrigger id="faixaEtaria">
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_VALUE}>Não especificada</SelectItem>
									{FAIXAS_ETARIAS.map((f) => (
										<SelectItem key={f} value={f}>
											{FAIXAS_LABEL[f]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="genero">Gênero (opcional)</Label>
							<Select
								value={form.genero || NO_VALUE}
								onValueChange={(v) =>
									setForm({
										...form,
										genero: v === NO_VALUE ? "" : (v as Genero),
									})
								}
							>
								<SelectTrigger id="genero">
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_VALUE}>Não especificado</SelectItem>
									{GENEROS.map((g) => (
										<SelectItem key={g} value={g}>
											{g}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="tamanho">Tamanho (opcional)</Label>
							<Input
								id="tamanho"
								value={form.tamanho}
								onChange={(e) => setForm({ ...form, tamanho: e.target.value })}
								placeholder="Ex.: M, G, 42"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="estacao">Estação (opcional)</Label>
							<Select
								value={form.estacao || NO_VALUE}
								onValueChange={(v) =>
									setForm({
										...form,
										estacao: v === NO_VALUE ? "" : (v as Estacao),
									})
								}
							>
								<SelectTrigger id="estacao">
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_VALUE}>Não especificada</SelectItem>
									{ESTACOES.map((s) => (
										<SelectItem key={s} value={s}>
											{ESTACOES_LABEL[s]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="condicao">Condição (opcional)</Label>
							<Select
								value={form.condicao || NO_VALUE}
								onValueChange={(v) =>
									setForm({
										...form,
										condicao: v === NO_VALUE ? "" : (v as CondicaoRoupa),
									})
								}
							>
								<SelectTrigger id="condicao">
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_VALUE}>Não especificada</SelectItem>
									{CONDICOES_ROUPA.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="quantidade">Quantidade</Label>
						<QuantityInput
							id="quantidade"
							mode="count"
							value={form.quantidade}
							onChange={(v) => setForm({ ...form, quantidade: v })}
							aria-invalid={!!errors.quantidade}
						/>
						{errors.quantidade && (
							<p className="text-xs font-medium text-destructive">
								{errors.quantidade}
							</p>
						)}
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
							{loading ? "Adicionando..." : "Adicionar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
