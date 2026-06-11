import { yupResolver } from "@hookform/resolvers/yup";
import { Trash2, UserPlus } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { CreatableCombobox } from "@/components/CreatableCombobox";
import type { ComboboxOption } from "@/components/CreatableCombobox/interface";
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
import { useSession } from "@/components/SessionProvider";
import { formatCep, formatCpf } from "@/lib/utils";
import APIService, { getErrorMessage } from "@/services/api";
import {
	ESCOLARIDADE_LABELS,
	type Escolaridade,
	type Familia,
	type FamiliaCreateDto,
	type FamiliaModalProps,
	type FamiliaModalRef,
	type FamiliaUpdateDto,
	type PessoaCreateDto,
	SITUACAO_MORADIA_LABELS,
	type SituacaoMoradia,
	TIPO_DOCUMENTO_LABELS,
	type TipoDocumentoAlternativo,
	VULNERABILIDADE_FLAGS,
} from "./interface";

type ModoIdentificacao = "cpf" | "nomeMae" | "documento";

const PESSOA_INICIAL: PessoaCreateDto = {
	nome: "",
	dataNascimento: "",
	possuiDeficiencia: false,
};

const schema = yup.object({
	rendaFamiliar: yup
		.number()
		.typeError("Informe a renda familiar")
		.min(0, "Renda inválida")
		.required("Informe a renda familiar"),
	situacaoMoradia: yup
		.mixed<SituacaoMoradia>()
		.oneOf(["Propria", "Alugada", "Cedida", "Irregular", "Abrigo"])
		.required(),
	vulnerabilidade: yup.number().default(0),
	observacoes: yup.string().default(""),
	rua: yup.string().trim().required("Rua é obrigatória"),
	numero: yup.string().trim().required("Número é obrigatório"),
	complemento: yup.string().default(""),
	bairro: yup.string().trim().required("Bairro é obrigatório"),
	cidadeId: yup
		.number()
		.min(1, "Selecione a cidade")
		.required("Selecione a cidade"),
	cep: yup
		.string()
		.matches(/^\d{5}-\d{3}$/, "CEP inválido (00000-000)")
		.required("CEP é obrigatório"),
});

type FamiliaFormValues = yup.InferType<typeof schema>;

const EMPTY_FORM: FamiliaFormValues = {
	rendaFamiliar: 0,
	situacaoMoradia: "Propria",
	vulnerabilidade: 0,
	observacoes: "",
	rua: "",
	numero: "",
	complemento: "",
	bairro: "",
	cidadeId: 0,
	cep: "",
};

function detectarModoIdentificacao(p: PessoaCreateDto): ModoIdentificacao {
	if (p.tipoDocumentoAlternativo) return "documento";
	if (p.nomeMae) return "nomeMae";
	return "cpf";
}

function validarResponsavel(p: PessoaCreateDto): string | null {
	if (!p.nome.trim()) return "Informe o nome do responsável.";
	if (!p.dataNascimento) return "Informe a data de nascimento do responsável.";
	const temCpf = !!p.cpf?.trim();
	const temNomeMae = !!p.nomeMae?.trim();
	const temDoc =
		!!p.tipoDocumentoAlternativo && !!p.identificacaoAlternativa?.trim();
	if (!temCpf && !temNomeMae && !temDoc)
		return "Informe ao menos uma identificação do responsável (CPF, nome da mãe ou documento).";
	return null;
}

interface PessoaFormProps {
	value: PessoaCreateDto;
	onChange: (p: PessoaCreateDto) => void;
	titulo: string;
	showExtra?: boolean;
}

function PessoaForm({
	value,
	onChange,
	titulo,
	showExtra = false,
}: PessoaFormProps) {
	const [modo, setModo] = useState<ModoIdentificacao>(() =>
		detectarModoIdentificacao(value),
	);

	const set = (field: keyof PessoaCreateDto, val: unknown) =>
		onChange({ ...value, [field]: val });

	const handleModoChange = (novoModo: ModoIdentificacao) => {
		setModo(novoModo);
		onChange({
			...value,
			cpf: undefined,
			nomeMae: undefined,
			tipoDocumentoAlternativo: undefined,
			identificacaoAlternativa: undefined,
		});
	};

	return (
		<div className="space-y-3 rounded-md border p-4">
			<p className="text-sm font-medium">{titulo}</p>

			<div className="grid grid-cols-2 gap-3">
				<div className="col-span-2 space-y-1">
					<Label>Nome *</Label>
					<Input
						value={value.nome}
						onChange={(e) => set("nome", e.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Data de Nascimento *</Label>
					<Input
						type="date"
						value={value.dataNascimento}
						onChange={(e) => set("dataNascimento", e.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Tipo de Identificação</Label>
					<Select
						value={modo}
						onValueChange={(v) => handleModoChange(v as ModoIdentificacao)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="cpf">CPF</SelectItem>
							<SelectItem value="nomeMae">Nome da Mãe</SelectItem>
							<SelectItem value="documento">Documento</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{modo === "cpf" && (
					<div className="col-span-2 space-y-1">
						<Label>CPF</Label>
						<Input
							placeholder="000.000.000-00"
							value={value.cpf ?? ""}
							onChange={(e) => set("cpf", formatCpf(e.target.value))}
						/>
					</div>
				)}

				{modo === "nomeMae" && (
					<div className="col-span-2 space-y-1">
						<Label>Nome da Mãe *</Label>
						<Input
							value={value.nomeMae ?? ""}
							onChange={(e) => set("nomeMae", e.target.value)}
						/>
					</div>
				)}

				{modo === "documento" && (
					<>
						<div className="space-y-1">
							<Label>Tipo de Documento *</Label>
							<Select
								value={value.tipoDocumentoAlternativo ?? ""}
								onValueChange={(v) =>
									set("tipoDocumentoAlternativo", v as TipoDocumentoAlternativo)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(TIPO_DOCUMENTO_LABELS).map(([k, v]) => (
										<SelectItem key={k} value={k}>
											{v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Número do Documento *</Label>
							<Input
								value={value.identificacaoAlternativa ?? ""}
								onChange={(e) =>
									set("identificacaoAlternativa", e.target.value)
								}
							/>
						</div>
					</>
				)}

				{showExtra && (
					<>
						<div className="space-y-1">
							<Label>Telefone</Label>
							<Input
								value={value.telefone ?? ""}
								onChange={(e) => set("telefone", e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label>Escolaridade</Label>
							<Select
								value={value.escolaridade}
								onValueChange={(v) => set("escolaridade", v as Escolaridade)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(ESCOLARIDADE_LABELS).map(([k, v]) => (
										<SelectItem key={k} value={k}>
											{v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Profissão</Label>
							<Input
								value={value.profissao ?? ""}
								onChange={(e) => set("profissao", e.target.value)}
							/>
						</div>
						<div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
							<Label>Possui deficiência</Label>
							<button
								type="button"
								role="switch"
								aria-checked={value.possuiDeficiencia}
								onClick={() =>
									set("possuiDeficiencia", !value.possuiDeficiencia)
								}
								className={`relative h-6 w-11 rounded-full transition-colors ${
									value.possuiDeficiencia ? "bg-primary" : "bg-muted"
								}`}
							>
								<span
									className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-background shadow transition-transform ${
										value.possuiDeficiencia ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
						<div className="col-span-2 space-y-1">
							<Label>Observações</Label>
							<Textarea
								rows={3}
								value={value.observacoes ?? ""}
								onChange={(e) => set("observacoes", e.target.value)}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export const FamiliaModal = forwardRef<FamiliaModalRef, FamiliaModalProps>(
	({ onSuccess }, ref) => {
		const [disabled, setDisabled] = useState<boolean>(false);
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Familia | null>(null);
		const [responsavel, setResponsavel] = useState<PessoaCreateDto>({
			...PESSOA_INICIAL,
		});
		const [membros, setMembros] = useState<PessoaCreateDto[]>([]);
		const [cidades, setCidades] = useState<ComboboxOption[]>([]);
		const { paroquiaAtual } = useSession();
		const [membroEmEdicao, setMembroEmEdicao] =
			useState<PessoaCreateDto | null>(null);
		const [adicionandoMembro, setAdicionandoMembro] = useState(false);

		const {
			register,
			handleSubmit,
			reset,
			control,
			watch,
			setValue,
			formState: { errors, isSubmitting },
		} = useForm<FamiliaFormValues>({
			resolver: yupResolver(schema),
			defaultValues: EMPTY_FORM,
		});

		const vulnerabilidade = watch("vulnerabilidade");

		useEffect(() => {
			if (!isOpen) return;
			APIService.getRequest<ComboboxOption[]>({
				url: "/familiacidades/select",
			})
				.then(setCidades)
				.catch(() => {});
		}, [isOpen]);

		const criarCidade = async (nome: string): Promise<ComboboxOption> => {
			const nova = await APIService.postRequest<ComboboxOption>({
				url: "/familiacidades",
				body: { nome },
			});
			setCidades((prev) =>
				prev.some((c) => c.value === nova.value) ? prev : [...prev, nova],
			);
			return nova;
		};

		const toggleVulnerabilidade = (flag: number) =>
			setValue("vulnerabilidade", (vulnerabilidade ?? 0) ^ flag);

		const refreshFamilia = async (familiaId: number) => {
			const familiaAtualizada = await APIService.getRequest<Familia>({
				url: `/familias/${familiaId}`,
			});
			setEditing(familiaAtualizada);
			return familiaAtualizada;
		};

		const familiaToForm = (familia: Familia): FamiliaFormValues => ({
			rendaFamiliar: familia.rendaFamiliar,
			situacaoMoradia: familia.situacaoMoradia,
			vulnerabilidade: familia.vulnerabilidade,
			observacoes: familia.observacoes ?? "",
			rua: familia.rua,
			numero: familia.numero,
			complemento: familia.complemento ?? "",
			bairro: familia.bairro,
			cidadeId: familia.cidadeId,
			cep: familia.cep,
		});

		const onSubmit = async (values: FamiliaFormValues) => {
			try {
				if (editing) {
					const dto: FamiliaUpdateDto = {
						paroquiaId: editing.paroquiaId,
						responsavelId: editing.responsavelId,
						rendaFamiliar: values.rendaFamiliar,
						situacaoMoradia: values.situacaoMoradia,
						vulnerabilidade: values.vulnerabilidade ?? 0,
						observacoes: values.observacoes,
						rua: values.rua,
						numero: values.numero,
						complemento: values.complemento,
						bairro: values.bairro,
						cidadeId: values.cidadeId,
						cep: values.cep,
					};
					await APIService.putRequest({
						url: `/familias/${editing.id}`,
						body: dto,
					});
				} else {
					const erroResponsavel = validarResponsavel(responsavel);
					if (erroResponsavel) {
						toast.error(erroResponsavel);
						return;
					}
					const dto: FamiliaCreateDto = {
						paroquiaId: paroquiaAtual?.value ?? 0,
						responsavel,
						membros,
						rendaFamiliar: values.rendaFamiliar,
						situacaoMoradia: values.situacaoMoradia,
						vulnerabilidade: values.vulnerabilidade ?? 0,
						observacoes: values.observacoes,
						rua: values.rua,
						numero: values.numero,
						complemento: values.complemento,
						bairro: values.bairro,
						cidadeId: values.cidadeId,
						cep: values.cep,
					};
					await APIService.postRequest<Familia>({
						url: "/familias",
						body: dto,
					});
				}
				setIsOpen(false);
				onSuccess();
			} catch (e) {
				toast.error(getErrorMessage(e, "Erro ao salvar família."));
			}
		};

		const handleAdicionarMembro = async () => {
			if (!membroEmEdicao || !editing) return;
			setAdicionandoMembro(true);
			try {
				await APIService.postRequest({
					url: `/familias/${editing.id}/membros`,
					body: membroEmEdicao,
				});
				await refreshFamilia(editing.id);
				setMembroEmEdicao(null);
				onSuccess();
				toast.success("Membro adicionado.");
			} catch (e) {
				toast.error(getErrorMessage(e, "Erro ao adicionar membro."));
			} finally {
				setAdicionandoMembro(false);
			}
		};

		const handleRemoverMembro = async (pessoaId: number) => {
			if (!editing) return;
			if (!confirm("Remover este membro da família?")) return;
			try {
				await APIService.deleteRequest({
					url: `/familias/${editing.id}/membros/${pessoaId}`,
				});
				await refreshFamilia(editing.id);
				onSuccess();
				toast.success("Membro removido.");
			} catch {
				toast.error("Erro ao remover membro.");
			}
		};

		const openView = (familia: Familia) => {
			setDisabled(true);
			setEditing(familia);
			setResponsavel({ ...PESSOA_INICIAL });
			setMembros([]);
			reset(familiaToForm(familia));
			setMembroEmEdicao(null);
			setIsOpen(true);
			refreshFamilia(familia.id).catch(() => {
				toast.error("Erro ao atualizar dados da família.");
			});
		};

		const open = (familia?: Familia) => {
			if (familia) {
				setEditing(familia);
				setResponsavel({ ...PESSOA_INICIAL });
				setMembros([]);
				reset(familiaToForm(familia));
				refreshFamilia(familia.id).catch(() => {
					toast.error("Erro ao atualizar dados da família.");
				});
			} else {
				setEditing(null);
				setResponsavel({ ...PESSOA_INICIAL });
				setMembros([]);
				reset(EMPTY_FORM);
			}
			setMembroEmEdicao(null);
			setIsOpen(true);
			setDisabled(false);
		};

		useImperativeHandle(ref, () => ({ open, openView }));

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar Família" : "Nova Família"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{/* Responsável */}
						{!editing && (
							<section className="space-y-3">
								<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
									Responsável
								</h3>
								<PessoaForm
									titulo="Dados do Responsável"
									value={responsavel}
									onChange={setResponsavel}
									showExtra
								/>
							</section>
						)}

						{/* Membros */}
						<section className="space-y-3">
							<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
								Membros
							</h3>

							{editing ? (
								<div className="space-y-2">
									{[editing.responsavel, ...editing.membros].map((m) => (
										<div
											key={m?.id}
											className="flex items-center justify-between rounded-md border px-3 py-2"
										>
											<div>
												<p className="text-sm font-medium">
													{m.nome}
													{m.id === editing.responsavelId && (
														<span className="ml-2 text-xs text-muted-foreground font-normal">
															(Responsável)
														</span>
													)}
												</p>
												<p className="text-xs text-muted-foreground">
													Nasc. {m.dataNascimento.slice(0, 10)}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												disabled={disabled}
												className="h-7 w-7 text-destructive hover:text-destructive"
												onClick={() => handleRemoverMembro(m.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}

									{membroEmEdicao ? (
										<div className="space-y-2">
											<PessoaForm
												titulo="Novo Membro"
												value={membroEmEdicao}
												onChange={setMembroEmEdicao}
												showExtra
											/>
											<div className="flex gap-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													disabled={disabled}
													onClick={() => setMembroEmEdicao(null)}
												>
													Cancelar
												</Button>
												<Button
													type="button"
													size="sm"
													disabled={adicionandoMembro || disabled}
													onClick={handleAdicionarMembro}
												>
													{adicionandoMembro ? "Salvando..." : "Confirmar"}
												</Button>
											</div>
										</div>
									) : (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={disabled}
											onClick={() => setMembroEmEdicao({ ...PESSOA_INICIAL })}
										>
											<UserPlus className="h-4 w-4" />
											Adicionar Membro
										</Button>
									)}
								</div>
							) : (
								<div className="space-y-2">
									{membros.map((m, i) => (
										<div
											key={`${m.nome}-${m.dataNascimento}-${i}`}
											className="flex items-center justify-between rounded-md border px-3 py-2"
										>
											<div>
												<p className="text-sm font-medium">
													{m.nome || "Sem nome"}
												</p>
												<p className="text-xs text-muted-foreground">
													Nasc. {m.dataNascimento || "—"}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												disabled={disabled}
												className="h-7 w-7 text-destructive hover:text-destructive"
												onClick={() =>
													setMembros(membros.filter((_, idx) => idx !== i))
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}

									{membroEmEdicao ? (
										<div className="space-y-2">
											<PessoaForm
												titulo="Novo Membro"
												value={membroEmEdicao}
												onChange={setMembroEmEdicao}
												showExtra
											/>
											<div className="flex gap-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													disabled={disabled}
													onClick={() => setMembroEmEdicao(null)}
												>
													Cancelar
												</Button>
												<Button
													type="button"
													size="sm"
													disabled={disabled}
													onClick={() => {
														setMembros([...membros, membroEmEdicao]);
														setMembroEmEdicao(null);
													}}
												>
													Confirmar
												</Button>
											</div>
										</div>
									) : (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={disabled}
											onClick={() => setMembroEmEdicao({ ...PESSOA_INICIAL })}
										>
											<UserPlus className="h-4 w-4" />
											Adicionar Membro
										</Button>
									)}
								</div>
							)}
						</section>

						{/* Dados Socioeconômicos */}
						<section className="space-y-4">
							<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
								Dados Socioeconômicos
							</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label>Renda Familiar (R$) *</Label>
									<Input
										type="number"
										min="0"
										step="0.01"
										disabled={disabled}
										{...register("rendaFamiliar", { valueAsNumber: true })}
									/>
									{errors.rendaFamiliar && (
										<p className="text-destructive text-xs">
											{errors.rendaFamiliar.message}
										</p>
									)}
								</div>
								<div className="space-y-1">
									<Label>Situação de Moradia *</Label>
									<Controller
										control={control}
										name="situacaoMoradia"
										render={({ field }) => (
											<Select
												disabled={disabled}
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Object.entries(SITUACAO_MORADIA_LABELS).map(
														([k, v]) => (
															<SelectItem key={k} value={k}>
																{v}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Vulnerabilidades</Label>
								<div className="flex flex-wrap gap-2">
									{VULNERABILIDADE_FLAGS.map((v) => {
										const active = ((vulnerabilidade ?? 0) & v.value) !== 0;
										return (
											<button
												key={v.value}
												type="button"
												disabled={disabled}
												onClick={() => toggleVulnerabilidade(v.value)}
												className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
													active
														? "bg-primary text-primary-foreground border-primary"
														: "border-input hover:bg-accent"
												} disabled:opacity-50 disabled:cursor-not-allowed`}
											>
												{v.label}
											</button>
										);
									})}
								</div>
							</div>

							<div className="space-y-1">
								<Label>Observações</Label>
								<Textarea
									rows={3}
									disabled={disabled}
									{...register("observacoes")}
								/>
							</div>
						</section>

						{/* Endereço */}
						<section className="space-y-4">
							<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
								Endereço
							</h3>
							<div className="grid grid-cols-3 gap-4">
								<div className="col-span-2 space-y-1">
									<Label>Rua *</Label>
									<Input disabled={disabled} {...register("rua")} />
									{errors.rua && (
										<p className="text-destructive text-xs">
											{errors.rua.message}
										</p>
									)}
								</div>
								<div className="space-y-1">
									<Label>Número *</Label>
									<Input
										type="number"
										min="0"
										disabled={disabled}
										{...register("numero")}
									/>
									{errors.numero && (
										<p className="text-destructive text-xs">
											{errors.numero.message}
										</p>
									)}
								</div>
								<div className="space-y-1">
									<Label>Complemento</Label>
									<Input disabled={disabled} {...register("complemento")} />
								</div>
								<div className="space-y-1">
									<Label>Bairro *</Label>
									<Input disabled={disabled} {...register("bairro")} />
									{errors.bairro && (
										<p className="text-destructive text-xs">
											{errors.bairro.message}
										</p>
									)}
								</div>
								<div className="space-y-1">
									<Label>CEP *</Label>
									<Controller
										control={control}
										name="cep"
										render={({ field }) => (
											<Input
												disabled={disabled}
												placeholder="00000-000"
												value={field.value}
												onChange={(e) =>
													field.onChange(formatCep(e.target.value))
												}
											/>
										)}
									/>
									{errors.cep && (
										<p className="text-destructive text-xs">
											{errors.cep.message}
										</p>
									)}
								</div>
								<div className="col-span-2 space-y-1">
									<Label>Cidade *</Label>
									<Controller
										control={control}
										name="cidadeId"
										render={({ field }) => (
											<CreatableCombobox
												disabled={disabled}
												value={field.value || null}
												onChange={(id) => field.onChange(id ?? 0)}
												options={cidades}
												onCreate={criarCidade}
												placeholder="Selecione a cidade"
											/>
										)}
									/>
									{errors.cidadeId && (
										<p className="text-destructive text-xs">
											{errors.cidadeId.message}
										</p>
									)}
								</div>
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
											: "Cadastrar"}
								</Button>
							)}
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
