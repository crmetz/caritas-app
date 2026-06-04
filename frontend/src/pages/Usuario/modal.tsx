import {
	type FormEvent,
	forwardRef,
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
import APIService from "@/services/api";
import type {
	Usuario,
	CreateUsuarioDto,
	UsuarioModalProps,
	UsuarioModalRef,
	UsuarioUpdateDto,
} from "./interface";
import { MultiSelect } from "@/components/ui/MultiSelect";

const INITIAL_FORM: CreateUsuarioDto = {
	nome: "",
	sobrenome: "",
	email: "",
	cpf: "",
	telefone: "",
	dataNasc: "",
	paroquiasPermitidas: [],
	perfilId: null,
};

export const UsuarioModal = forwardRef<UsuarioModalRef, UsuarioModalProps>(
	({ onSuccess }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Usuario | null>(null);
		const [loading, setLoading] = useState(false);
		const [form, setForm] = useState<CreateUsuarioDto>(INITIAL_FORM);

		const setField = (
			field: keyof CreateUsuarioDto,
			value: string | number | null | number[],
		) => setForm((prev) => ({ ...prev, [field]: value }));

		const open = (usuario?: Usuario) => {
			if (usuario) {
				setEditing(usuario);
				setForm({
					nome: usuario.nome ?? "",
					sobrenome: usuario.sobrenome ?? "",
					email: usuario.email,
					cpf: usuario.cpf ?? "",
					telefone: usuario.telefone ?? "",
					dataNasc: usuario.dataNasc?.slice(0, 10) ?? "",
					paroquiasPermitidas: usuario.paroquiasPermitidas ?? [],
					perfilId: usuario.perfilId,
				});
			} else {
				setEditing(null);
				setForm(INITIAL_FORM);
			}
			setIsOpen(true);
		};

		useImperativeHandle(ref, () => ({ open }));

		const handleSubmit = async (event: FormEvent) => {
			event.preventDefault();
			setLoading(true);

			try {
				if (editing) {
					const dto: UsuarioUpdateDto = {
						nome: form.nome,
						sobrenome: form.sobrenome,
						cpf: form.cpf,
						telefone: form.telefone,
						dataNasc: form.dataNasc || undefined,
						paroquiasPermitidas: form.paroquiasPermitidas,
						perfilId: form.perfilId,
					};
					await APIService.putRequest({
						url: `/usuarios/${editing.id}`,
						body: dto,
					});
					toast.success("Usuário atualizado.");
				} else {
					await APIService.postRequest<Usuario>({
						url: "/auth/register",
						body: {
							...form,
							dataNasc: form.dataNasc || undefined,
							perfilId: form.perfilId,
						},
					});
					toast.success("Usuário cadastrado.");
				}

				setIsOpen(false);
				onSuccess();
			} catch {
				toast.error("Erro ao salvar usuário.");
			} finally {
				setLoading(false);
			}
		};

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar Usuário" : "Novo Usuário"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-6">
						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Dados pessoais
							</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-1">
									<Label htmlFor="usuario-nome">Nome *</Label>
									<Input
										id="usuario-nome"
										required
										value={form.nome}
										onChange={(event) => setField("nome", event.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="usuario-sobrenome">Sobrenome *</Label>
									<Input
										id="usuario-sobrenome"
										required
										value={form.sobrenome}
										onChange={(event) =>
											setField("sobrenome", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="usuario-cpf">CPF</Label>
									<Input
										id="usuario-cpf"
										placeholder="000.000.000-00"
										value={form.cpf ?? ""}
										onChange={(event) => setField("cpf", event.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="usuario-data-nasc">Data de nascimento</Label>
									<Input
										id="usuario-data-nasc"
										type="date"
										value={form.dataNasc ?? ""}
										onChange={(event) =>
											setField("dataNasc", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1 md:col-span-2">
									<Label htmlFor="usuario-telefone">Telefone</Label>
									<Input
										id="usuario-telefone"
										placeholder="(00) 00000-0000"
										value={form.telefone ?? ""}
										onChange={(event) =>
											setField("telefone", event.target.value)
										}
									/>
								</div>
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Paróquias
							</h3>
							<div className="space-y-1">
								<Label>Paróquias vinculadas</Label>
								<MultiSelect<number>
									value={form.paroquiasPermitidas}
									onChange={(ids) => setField("paroquiasPermitidas", ids)}
									fetchOptions={() =>
										APIService.getRequest({ url: "/paroquias/select" })
									}
									placeholder="Selecione as paróquias..."
								/>
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Acesso
							</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-1">
									<Label htmlFor="usuario-email">E-mail *</Label>
									<Input
										id="usuario-email"
										type="email"
										required
										disabled={Boolean(editing)}
										value={form.email}
										onChange={(event) => setField("email", event.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="usuario-perfil">Perfil</Label>
									<Input
										id="usuario-perfil"
										type="number"
										min="1"
										placeholder="ID do perfil"
										value={form.perfilId ?? ""}
										onChange={(event) =>
											setField(
												"perfilId",
												event.target.value ? Number(event.target.value) : null,
											)
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
