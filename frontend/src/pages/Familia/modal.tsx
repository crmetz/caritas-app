import {
	type FormEvent,
	forwardRef,
	useImperativeHandle,
	useState,
} from "react";
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
	type Familia,
	type FamiliaCreateDto,
	type FamiliaModalProps,
	type FamiliaModalRef,
	type FamiliaUpdateDto,
	SITUACAO_MORADIA_LABELS,
	type SituacaoMoradia,
	VULNERABILIDADE_FLAGS,
} from "./interface";

const INITIAL_CREATE: FamiliaCreateDto = {
	responsavel: {
		nome: "",
		cpf: "",
		dataNascimento: "",
		possuiDeficiencia: false,
	},
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

export const FamiliaModal = forwardRef<FamiliaModalRef, FamiliaModalProps>(
	({ onSuccess }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Familia | null>(null);
		const [loading, setLoading] = useState(false);
		const [form, setForm] = useState<FamiliaCreateDto>(INITIAL_CREATE);

		const setField = (field: string, value: unknown) =>
			setForm((prev) => ({ ...prev, [field]: value }));

		const setRespField = (field: string, value: unknown) =>
			setForm((prev) => ({
				...prev,
				responsavel: { ...prev.responsavel, [field]: value },
			}));

		const toggleVulnerabilidade = (flag: number) =>
			setField("vulnerabilidade", form.vulnerabilidade ^ flag);

		const handleSubmit = async (e: FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				if (editing) {
					const dto: FamiliaUpdateDto = {
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
			} finally {
				setLoading(false);
			}
		};

		const open = (familia?: Familia) => {
			if (familia) {
				setEditing(familia);
				setForm({
					responsavel: {
						nome: familia.responsavel?.nome ?? "",
						cpf: familia.responsavel?.cpf ?? "",
						dataNascimento:
							familia.responsavel?.dataNascimento.slice(0, 10) ?? "",
						possuiDeficiencia: familia.responsavel?.possuiDeficiencia ?? false,
					},
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
			} else {
				setEditing(null);
				setForm(INITIAL_CREATE);
			}
			setIsOpen(true);
		};

		useImperativeHandle(ref, () => ({
			open,
		}));

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar Família" : "Nova Família"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-6">
						{!editing && (
							<section className="space-y-4">
								<h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
									Responsável
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="col-span-2 space-y-1">
										<Label htmlFor="resp-nome">Nome *</Label>
										<Input
											required
											value={form.responsavel.nome}
											onChange={(e) => setRespField("nome", e.target.value)}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="resp-cpf">CPF</Label>
										<Input
											placeholder="000.000.000-00"
											value={form.responsavel.cpf ?? ""}
											onChange={(e) => setRespField("cpf", e.target.value)}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="resp-nasc">Data de Nascimento *</Label>
										<Input
											type="date"
											required
											value={form.responsavel.dataNascimento}
											onChange={(e) =>
												setRespField("dataNascimento", e.target.value)
											}
										/>
									</div>
								</div>
							</section>
						)}

						<section className="space-y-4">
							<h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
								Dados Socioeconômicos
							</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="renda">Renda Familiar (R$) *</Label>
									<Input
										type="number"
										min="0"
										step="0.01"
										required
										value={form.rendaFamiliar}
										onChange={(e) =>
											setField("rendaFamiliar", parseFloat(e.target.value) || 0)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Situação de Moradia *</Label>
									<Select
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
												onClick={() => toggleVulnerabilidade(v.value)}
												className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
													active
														? "bg-primary text-primary-foreground border-primary"
														: "border-input hover:bg-accent"
												}`}
											>
												{v.label}
											</button>
										);
									})}
								</div>
							</div>

							<div className="space-y-1">
								<Label htmlFor="obs">Observações</Label>
								<Textarea
									rows={3}
									value={form.observacoes ?? ""}
									onChange={(e) => setField("observacoes", e.target.value)}
								/>
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
								Endereço
							</h3>
							<div className="grid grid-cols-3 gap-4">
								<div className="col-span-2 space-y-1">
									<Label htmlFor="rua">Rua *</Label>
									<Input
										required
										value={form.rua}
										onChange={(e) => setField("rua", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="numero">Número *</Label>
									<Input
										required
										value={form.numero}
										onChange={(e) => setField("numero", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="complemento">Complemento</Label>
									<Input
										value={form.complemento ?? ""}
										onChange={(e) => setField("complemento", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="bairro">Bairro *</Label>
									<Input
										required
										value={form.bairro}
										onChange={(e) => setField("bairro", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="cep">CEP *</Label>
									<Input
										required
										placeholder="00000-000"
										value={form.cep}
										onChange={(e) => setField("cep", e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1">
									<Label htmlFor="cidade">Cidade *</Label>
									<Input
										required
										value={form.cidade}
										onChange={(e) => setField("cidade", e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="estado">Estado *</Label>
									<Input
										required
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
								onClick={() => setIsOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
