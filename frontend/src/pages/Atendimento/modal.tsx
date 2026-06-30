import { yupResolver } from "@hookform/resolvers/yup";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import APIService, { getErrorMessage } from "@/services/api";
import {
	type Atendimento,
	type AtendimentoCreateDto,
	type AtendimentoModalProps,
	type AtendimentoModalRef,
	type AtendimentoUpdateDto,
	SITUACAO_GERAL_LABELS,
	type SituacaoGeralFamilia,
} from "./interface";

interface SelectOption {
	value: number;
	label: string;
}

const SITUACAO_NENHUMA = "none";

const emptyToNull = (value: number, original: unknown) =>
	original === "" || Number.isNaN(value) ? null : value;

const schema = yup.object({
	familiaId: yup
		.number()
		.min(1, "Selecione a família")
		.required("Selecione a família"),
	voluntarioId: yup
		.number()
		.min(1, "Selecione o voluntário")
		.required("Selecione o voluntário"),
	dataAtendimento: yup.string().required("Informe a data do atendimento"),
	relato: yup.string().trim().required("Informe o relato da visita"),
	rendaFamiliarMomento: yup
		.number()
		.transform(emptyToNull)
		.nullable()
		.min(0, "Renda inválida")
		.default(null),
	qtdMembrosTrabalhando: yup
		.number()
		.transform(emptyToNull)
		.nullable()
		.integer("Informe um número inteiro")
		.min(0, "Valor inválido")
		.default(null),
	necessidadesIdentificadas: yup.string().default(""),
	encaminhamentosRealizados: yup.string().default(""),
	situacaoGeral: yup
		.mixed<SituacaoGeralFamilia>()
		.oneOf(["Critica", "Estavel", "EmEvolucao", "Superada"])
		.nullable()
		.default(null),
});

type AtendimentoFormValues = yup.InferType<typeof schema>;

const hoje = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: AtendimentoFormValues = {
	familiaId: 0,
	voluntarioId: 0,
	dataAtendimento: hoje(),
	relato: "",
	rendaFamiliarMomento: null,
	qtdMembrosTrabalhando: null,
	necessidadesIdentificadas: "",
	encaminhamentosRealizados: "",
	situacaoGeral: null,
};

export const AtendimentoModal = forwardRef<
	AtendimentoModalRef,
	AtendimentoModalProps
>(({ onSuccess }, ref) => {
	const { session } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState<Atendimento | null>(null);
	const [disabled, setDisabled] = useState(false);
	const [familias, setFamilias] = useState<SelectOption[]>([]);
	const [voluntarios, setVoluntarios] = useState<SelectOption[]>([]);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<AtendimentoFormValues>({
		resolver: yupResolver(schema),
		defaultValues: EMPTY_FORM,
	});

	useEffect(() => {
		if (!isOpen) return;
		APIService.getRequest<SelectOption[]>({ url: "/familias/select" })
			.then(setFamilias)
			.catch(() => {});
		APIService.getRequest<SelectOption[]>({ url: "/usuarios/select" })
			.then(setVoluntarios)
			.catch(() => {});
	}, [isOpen]);

	const atendimentoToForm = (a: Atendimento): AtendimentoFormValues => ({
		familiaId: a.familiaId,
		voluntarioId: a.voluntarioId,
		dataAtendimento: a.dataAtendimento.slice(0, 10),
		relato: a.relato,
		rendaFamiliarMomento: a.rendaFamiliarMomento,
		qtdMembrosTrabalhando: a.qtdMembrosTrabalhando,
		necessidadesIdentificadas: a.necessidadesIdentificadas ?? "",
		encaminhamentosRealizados: a.encaminhamentosRealizados ?? "",
		situacaoGeral: a.situacaoGeral,
	});

	const onSubmit = async (values: AtendimentoFormValues) => {
		try {
			if (editing) {
				const dto: AtendimentoUpdateDto = {
					voluntarioId: values.voluntarioId,
					dataAtendimento: values.dataAtendimento,
					relato: values.relato,
					rendaFamiliarMomento: values.rendaFamiliarMomento,
					qtdMembrosTrabalhando: values.qtdMembrosTrabalhando,
					necessidadesIdentificadas: values.necessidadesIdentificadas,
					encaminhamentosRealizados: values.encaminhamentosRealizados,
					situacaoGeral: values.situacaoGeral,
				};
				await APIService.putRequest({
					url: `/atendimentos/${editing.id}`,
					body: dto,
				});
			} else {
				const dto: AtendimentoCreateDto = {
					familiaId: values.familiaId,
					voluntarioId: values.voluntarioId,
					dataAtendimento: values.dataAtendimento,
					relato: values.relato,
					rendaFamiliarMomento: values.rendaFamiliarMomento,
					qtdMembrosTrabalhando: values.qtdMembrosTrabalhando,
					necessidadesIdentificadas: values.necessidadesIdentificadas,
					encaminhamentosRealizados: values.encaminhamentosRealizados,
					situacaoGeral: values.situacaoGeral,
				};
				await APIService.postRequest({ url: "/atendimentos", body: dto });
			}
			setIsOpen(false);
			onSuccess();
			toast.success(
				editing ? "Atendimento atualizado." : "Atendimento registrado.",
			);
		} catch (e) {
			toast.error(getErrorMessage(e, "Erro ao salvar atendimento."));
		}
	};

	const openView = (atendimento: Atendimento) => {
		setDisabled(true);
		setEditing(atendimento);
		reset(atendimentoToForm(atendimento));
		setIsOpen(true);
	};

	const open = (atendimento?: Atendimento) => {
		if (atendimento) {
			setEditing(atendimento);
			reset(atendimentoToForm(atendimento));
		} else {
			setEditing(null);
			reset({ ...EMPTY_FORM, voluntarioId: session?.id ?? 0 });
		}
		setDisabled(false);
		setIsOpen(true);
	};

	useImperativeHandle(ref, () => ({ open, openView }));

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Editar Atendimento" : "Novo Atendimento"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<section className="space-y-4">
						<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
							Visita
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label>Família *</Label>
								<Controller
									control={control}
									name="familiaId"
									render={({ field }) => (
										<Select
											disabled={disabled || editing !== null}
											value={field.value ? String(field.value) : ""}
											onValueChange={(v) => field.onChange(Number(v))}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecione a família" />
											</SelectTrigger>
											<SelectContent>
												{familias.map((f) => (
													<SelectItem key={f.value} value={String(f.value)}>
														{f.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.familiaId && (
									<p className="text-destructive text-xs">
										{errors.familiaId.message}
									</p>
								)}
							</div>

							<div className="space-y-1">
								<Label>Voluntário *</Label>
								<Controller
									control={control}
									name="voluntarioId"
									render={({ field }) => (
										<Select
											disabled={disabled}
											value={field.value ? String(field.value) : ""}
											onValueChange={(v) => field.onChange(Number(v))}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o voluntário" />
											</SelectTrigger>
											<SelectContent>
												{voluntarios.map((u) => (
													<SelectItem key={u.value} value={String(u.value)}>
														{u.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.voluntarioId && (
									<p className="text-destructive text-xs">
										{errors.voluntarioId.message}
									</p>
								)}
							</div>

							<div className="space-y-1">
								<Label>Data do Atendimento *</Label>
								<Input
									type="date"
									disabled={disabled}
									{...register("dataAtendimento")}
								/>
								{errors.dataAtendimento && (
									<p className="text-destructive text-xs">
										{errors.dataAtendimento.message}
									</p>
								)}
							</div>

							<div className="space-y-1">
								<Label>Situação Geral</Label>
								<Controller
									control={control}
									name="situacaoGeral"
									render={({ field }) => (
										<Select
											disabled={disabled}
											value={field.value ?? SITUACAO_NENHUMA}
											onValueChange={(v) =>
												field.onChange(
													v === SITUACAO_NENHUMA
														? null
														: (v as SituacaoGeralFamilia),
												)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Não avaliada" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={SITUACAO_NENHUMA}>
													Não avaliada
												</SelectItem>
												{Object.entries(SITUACAO_GERAL_LABELS).map(([k, v]) => (
													<SelectItem key={k} value={k}>
														{v}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label>Relato da Visita *</Label>
							<Textarea rows={4} disabled={disabled} {...register("relato")} />
							{errors.relato && (
								<p className="text-destructive text-xs">
									{errors.relato.message}
								</p>
							)}
						</div>
					</section>

					<section className="space-y-4">
						<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
							Indicadores de Evolução
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label>Renda Familiar no Momento (R$)</Label>
								<Input
									type="number"
									min="0"
									step="0.01"
									disabled={disabled}
									{...register("rendaFamiliarMomento", { valueAsNumber: true })}
								/>
								{errors.rendaFamiliarMomento && (
									<p className="text-destructive text-xs">
										{errors.rendaFamiliarMomento.message}
									</p>
								)}
							</div>
							<div className="space-y-1">
								<Label>Membros Trabalhando</Label>
								<Input
									type="number"
									min="0"
									step="1"
									disabled={disabled}
									{...register("qtdMembrosTrabalhando", {
										valueAsNumber: true,
									})}
								/>
								{errors.qtdMembrosTrabalhando && (
									<p className="text-destructive text-xs">
										{errors.qtdMembrosTrabalhando.message}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-1">
							<Label>Necessidades Identificadas</Label>
							<Textarea
								rows={3}
								disabled={disabled}
								{...register("necessidadesIdentificadas")}
							/>
						</div>

						<div className="space-y-1">
							<Label>Encaminhamentos Realizados</Label>
							<Textarea
								rows={3}
								disabled={disabled}
								{...register("encaminhamentosRealizados")}
							/>
						</div>
					</section>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
						>
							{disabled ? "Fechar" : "Cancelar"}
						</Button>
						{!disabled && (
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? "Salvando..."
									: editing
										? "Salvar"
										: "Registrar"}
							</Button>
						)}
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
});
