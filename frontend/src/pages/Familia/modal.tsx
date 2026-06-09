import { Trash2, UserPlus } from "lucide-react";
import {
	type FormEvent,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import { toast } from "react-toastify";
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
import APIService from "@/services/api";
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

interface SelectOption {
	value: number;
	label: string;
}

const PESSOA_INICIAL: PessoaCreateDto = {
	nome: "",
	dataNascimento: "",
	possuiDeficiencia: false,
};

const CREATE_INICIAL: FamiliaCreateDto = {
	paroquiaId: 0,
	responsavel: { ...PESSOA_INICIAL },
	membros: [],
	rendaFamiliar: 0,
	situacaoMoradia: "Propria",
	vulnerabilidade: 0,
	rua: "",
	numero: "",
	bairro: "",
	cidade: "",
	estado: "",
	cep: "",
};

function detectarModoIdentificacao(p: PessoaCreateDto): ModoIdentificacao {
	if (p.tipoDocumentoAlternativo) return "documento";
	if (p.nomeMae) return "nomeMae";
	return "cpf";
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
						required
						value={value.nome}
						onChange={(e) => set("nome", e.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Data de Nascimento *</Label>
					<Input
						type="date"
						required
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
							onChange={(e) => set("cpf", e.target.value)}
						/>
					</div>
				)}

				{modo === "nomeMae" && (
					<div className="col-span-2 space-y-1">
						<Label>Nome da Mãe *</Label>
						<Input
							required
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
								required
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
		const [loading, setLoading] = useState(false);
		const [form, setForm] = useState<FamiliaCreateDto>(CREATE_INICIAL);
		const [paroquias, setParoquias] = useState<SelectOption[]>([]);
		const [membroEmEdicao, setMembroEmEdicao] =
			useState<PessoaCreateDto | null>(null);
		const [adicionandoMembro, setAdicionandoMembro] = useState(false);

		useEffect(() => {
			if (isOpen) {
				APIService.getRequest<SelectOption[]>({ url: "/paroquias/select" })
					.then(setParoquias)
					.catch(() => {});
			}
		}, [isOpen]);

		const setField = <K extends keyof FamiliaCreateDto>(
			field: K,
			value: FamiliaCreateDto[K],
		) => setForm((prev) => ({ ...prev, [field]: value }));

		const toggleVulnerabilidade = (flag: number) =>
			setField("vulnerabilidade", form.vulnerabilidade ^ flag);

		const refreshFamilia = async (familiaId: number) => {
			const familiaAtualizada = await APIService.getRequest<Familia>({
				url: `/familias/${familiaId}`,
			});
			setEditing(familiaAtualizada);
			return familiaAtualizada;
		};

		const handleSubmit = async (e: FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				if (editing) {
					const dto: FamiliaUpdateDto = {
						paroquiaId: form.paroquiaId,
						responsavelId: editing.responsavelId,
						rendaFamiliar: form.rendaFamiliar,
						situacaoMoradia: form.situacaoMoradia,
						vulnerabilidade: form.vulnerabilidade,
						observacoes: form.observacoes,
						rua: form.rua,
						numero: form.numero,
						complemento: form.complemento,
						bairro: form.bairro,
						cidade: form.cidade,
						estado: form.estado,
						cep: form.cep,
					};
					await APIService.putRequest({
						url: `/familias/${editing.id}`,
						body: dto,
					});
				} else {
					await APIService.postRequest<Familia>({
						url: "/familias",
						body: form,
					});
				}
				setIsOpen(false);
				onSuccess();
			} catch {
				toast.error("Erro ao salvar família.");
			} finally {
				setLoading(false);
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
			} catch {
				toast.error("Erro ao adicionar membro.");
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
			setForm({
				paroquiaId: familia.paroquiaId,
				responsavel: { ...PESSOA_INICIAL },
				membros: [],
				rendaFamiliar: familia.rendaFamiliar,
				situacaoMoradia: familia.situacaoMoradia,
				vulnerabilidade: familia.vulnerabilidade,
				observacoes: familia.observacoes ?? "",
				rua: familia.rua,
				numero: familia.numero,
				complemento: familia.complemento ?? "",
				bairro: familia.bairro,
				cidade: familia.cidade,
				estado: familia.estado,
				cep: familia.cep,
			});
			setMembroEmEdicao(null);
			setIsOpen(true);
			refreshFamilia(familia.id).catch(() => {
				toast.error("Erro ao atualizar dados da família.");
			});
		};

		const open = (familia?: Familia) => {
			if (familia) {
				setEditing(familia);
				setForm({
					paroquiaId: familia.paroquiaId,
					responsavel: { ...PESSOA_INICIAL },
					membros: [],
					rendaFamiliar: familia.rendaFamiliar,
					situacaoMoradia: familia.situacaoMoradia,
					vulnerabilidade: familia.vulnerabilidade,
					observacoes: familia.observacoes ?? "",
					rua: familia.rua,
					numero: familia.numero,
					complemento: familia.complemento ?? "",
					bairro: familia.bairro,
					cidade: familia.cidade,
					estado: familia.estado,
					cep: familia.cep,
				});
				refreshFamilia(familia.id).catch(() => {
					toast.error("Erro ao atualizar dados da família.");
				});
			} else {
				setEditing(null);
				setForm(CREATE_INICIAL);
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

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Paróquia */}
						<section className="space-y-3">
							<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
								Paróquia
							</h3>
							<div className="space-y-1">
								<Label>Paróquia *</Label>
								<Select
									required
									disabled={disabled}
									value={form.paroquiaId ? String(form.paroquiaId) : ""}
									onValueChange={(v) => setField("paroquiaId", Number(v))}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a paróquia" />
									</SelectTrigger>
									<SelectContent>
										{paroquias.map((p) => (
											<SelectItem key={p.value} value={String(p.value)}>
												{p.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</section>

						{/* Responsável */}
						{!editing && (
							<section className="space-y-3">
								<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
									Responsável
								</h3>
								<PessoaForm
									titulo="Dados do Responsável"
									value={form.responsavel}
									onChange={(p) => setField("responsavel", p)}
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
									{form.membros.map((m, i) => (
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
													setField(
														"membros",
														form.membros.filter((_, idx) => idx !== i),
													)
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
														setField("membros", [
															...form.membros,
															membroEmEdicao,
														]);
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
										required
										disabled={disabled}
										value={form.rendaFamiliar}
										onChange={(e) =>
											setField("rendaFamiliar", parseFloat(e.target.value) || 0)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Situação de Moradia *</Label>
									<Select
										disabled={disabled}
										value={form.situacaoMoradia}
										onValueChange={(v) =>
											setField("situacaoMoradia", v as SituacaoMoradia)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(SITUACAO_MORADIA_LABELS).map(([k, v]) => (
												<SelectItem key={k} value={k}>
													{v}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Vulnerabilidades</Label>
								<div className="flex flex-wrap gap-2">
									{VULNERABILIDADE_FLAGS.map((v) => {
										const active = (form.vulnerabilidade & v.value) !== 0;
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
									value={form.observacoes ?? ""}
									onChange={(e) => setField("observacoes", e.target.value)}
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
									<Input
										required
										disabled={disabled}
										value={form.rua}
										onChange={(e) => setField("rua", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Número *</Label>
									<Input
										required
										disabled={disabled}
										value={form.numero}
										onChange={(e) => setField("numero", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Complemento</Label>
									<Input
										disabled={disabled}
										value={form.complemento ?? ""}
										onChange={(e) => setField("complemento", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Bairro *</Label>
									<Input
										required
										disabled={disabled}
										value={form.bairro}
										onChange={(e) => setField("bairro", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>CEP *</Label>
									<Input
										required
										disabled={disabled}
										placeholder="00000-000"
										value={form.cep}
										onChange={(e) => setField("cep", e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1">
									<Label>Cidade *</Label>
									<Input
										required
										disabled={disabled}
										value={form.cidade}
										onChange={(e) => setField("cidade", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Estado *</Label>
									<Input
										required
										disabled={disabled}
										maxLength={2}
										placeholder="UF"
										value={form.estado}
										onChange={(e) =>
											setField("estado", e.target.value.toUpperCase())
										}
									/>
								</div>
							</div>
						</section>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								disabled={disabled}
								onClick={() => setIsOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading || disabled}>
								{loading ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
