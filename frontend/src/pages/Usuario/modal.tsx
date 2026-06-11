import { forwardRef, useImperativeHandle, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
	ParoquiaSelect,
	type ParoquiaSelectOption,
} from "@/components/ParoquiaSelect";
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
	CreateUsuarioDto,
	Usuario,
	UsuarioModalProps,
	UsuarioModalRef,
} from "./interface";

const EMPTY_FORM: CreateUsuarioDto = {
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
		const [editingId, setEditingId] = useState<number | null>(null);
		const [fetchingUser, setFetchingUser] = useState(false);
		const [paroquiasOptions, setParoquiasOptions] = useState<
			ParoquiaSelectOption[]
		>([]);

		const { register, handleSubmit, reset, control, setValue } =
			useForm<CreateUsuarioDto>({ defaultValues: EMPTY_FORM });

		const open = async (id?: number) => {
			const opcoesParoquia = await APIService.getRequest<
				ParoquiaSelectOption[]
			>({
				url: "/paroquias/select",
			}).catch(() => [] as ParoquiaSelectOption[]);

			if (id !== undefined) {
				setEditingId(id);
				setIsOpen(true);
				setFetchingUser(true);
				try {
					const usuario = await APIService.getRequest<Usuario>({
						url: `/usuarios/${id}`,
					});

					// Mescla as opções do editor com as paróquias já atribuídas ao usuário editado,
					// para que paróquias fora do escopo do editor não desapareçam do dropdown.
					const merged = new Map<number, ParoquiaSelectOption>(
						opcoesParoquia.map((op) => [op.value, op]),
					);
					for (const p of usuario.paroquiasPermitidas ?? []) {
						if (!merged.has(p.value)) {
							merged.set(p.value, {
								value: p.value,
								label: p.label ?? `Paróquia ${p.value}`,
							});
						}
					}
					setParoquiasOptions([...merged.values()]);

					reset({
						nome: usuario.nome,
						sobrenome: usuario.sobrenome,
						email: usuario.email,
						cpf: usuario.cpf ?? "",
						telefone: usuario.telefone ?? "",
						dataNasc: usuario.dataNasc?.slice(0, 10),
						paroquiasPermitidas: (usuario.paroquiasPermitidas ?? []).map(
							(p) => p.value,
						),
						perfilId: usuario.perfilId,
					});
				} catch {
					toast.error("Erro ao carregar usuário.");
					setIsOpen(false);
				} finally {
					setFetchingUser(false);
				}
			} else {
				setParoquiasOptions(opcoesParoquia);
				setEditingId(null);
				reset(EMPTY_FORM);
				setIsOpen(true);
			}
		};

		useImperativeHandle(ref, () => ({ open }));

		const onSubmit = async (values: CreateUsuarioDto) => {
			try {
				if (editingId !== null) {
					const { email: _, ...dto } = values;
					await APIService.putRequest({
						url: `/usuarios/${editingId}`,
						body: dto,
					});
					toast.success("Usuário atualizado.");
				} else {
					await APIService.postRequest<Usuario>({
						url: "/auth/register",
						body: values,
					});
					toast.success("Usuário cadastrado.");
				}
				setIsOpen(false);
				onSuccess();
			} catch {
				toast.error("Erro ao salvar usuário.");
			}
		};

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingId !== null ? "Editar Usuário" : "Novo Usuário"}
						</DialogTitle>
					</DialogHeader>

					{fetchingUser ? (
						<div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
							Carregando...
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<section className="space-y-4">
								<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
									Dados pessoais
								</h3>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-1">
										<Label htmlFor="usuario-nome">Nome *</Label>
										<Input id="usuario-nome" required {...register("nome")} />
									</div>
									<div className="space-y-1">
										<Label htmlFor="usuario-sobrenome">Sobrenome *</Label>
										<Input
											id="usuario-sobrenome"
											required
											{...register("sobrenome")}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="usuario-cpf">CPF</Label>
										<Input
											id="usuario-cpf"
											placeholder="000.000.000-00"
											{...register("cpf")}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="usuario-data-nasc">
											Data de nascimento
										</Label>
										<Input
											id="usuario-data-nasc"
											type="date"
											{...register("dataNasc", {
												setValueAs: (v) => v || undefined,
											})}
										/>
									</div>
									<div className="space-y-1 md:col-span-2">
										<Label htmlFor="usuario-telefone">Telefone</Label>
										<Input
											id="usuario-telefone"
											placeholder="(00) 00000-0000"
											{...register("telefone")}
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
									<Controller
										name="paroquiasPermitidas"
										control={control}
										render={({ field }) => (
											<ParoquiaSelect
												value={field.value ?? []}
												onChange={(vals) =>
													setValue("paroquiasPermitidas", vals, {
														shouldDirty: true,
													})
												}
												options={paroquiasOptions}
												placeholder="Selecione as paróquias..."
											/>
										)}
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
											disabled={editingId !== null}
											{...register("email")}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="usuario-perfil">Perfil</Label>
										<Controller
											name="perfilId"
											control={control}
											render={({ field }) => (
												<Input
													id="usuario-perfil"
													type="number"
													min="1"
													placeholder="ID do perfil"
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(e.target.value)
																: undefined,
														)
													}
												/>
											)}
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
								<Button type="submit">
									{editingId !== null ? "Salvar" : "Cadastrar"}
								</Button>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>
		);
	},
);
