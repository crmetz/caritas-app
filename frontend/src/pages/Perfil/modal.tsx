import { yupResolver } from "@hookform/resolvers/yup";
import { Check, TriangleAlert } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import APIService, { getErrorMessage } from "@/services/api";
import type {
	Perfil,
	PerfilCreateDto,
	PerfilModalProps,
	PerfilModalRef,
	PerfilUpdateDto,
	PermissionModule,
} from "./interface";

const schema = yup.object({
	nome: yup.string().required("Nome é obrigatório"),
	descricao: yup.string().optional().default(""),
});

type PerfilFormValues = yup.InferType<typeof schema>;

const EMPTY_FORM: PerfilFormValues = { nome: "", descricao: "" };

export const PerfilModal = forwardRef<PerfilModalRef, PerfilModalProps>(
	({ onSuccess }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Perfil | null>(null);
		const [modules, setModules] = useState<PermissionModule[]>([]);
		const [selected, setSelected] = useState<string[]>([]);

		const {
			register,
			handleSubmit,
			reset,
			formState: { errors, isSubmitting },
		} = useForm<PerfilFormValues>({
			resolver: yupResolver(schema),
			defaultValues: EMPTY_FORM,
		});

		const open = async (perfil?: Perfil) => {
			if (perfil) {
				setEditing(perfil);
				reset({ nome: perfil.nome, descricao: perfil.descricao ?? "" });
			} else {
				setEditing(null);
				reset(EMPTY_FORM);
			}
			setSelected([]);
			setIsOpen(true);

			try {
				const catalog = await APIService.getRequest<PermissionModule[]>({
					url: "/permissoes",
				});
				setModules(catalog);

				if (perfil) {
					// A listagem não traz as permissões; busca o perfil completo para pré-selecionar.
					const full = await APIService.getRequest<Perfil>({
						url: `/perfis/${perfil.id}`,
					});
					setSelected(full.permissions ?? []);
				}
			} catch {
				toast.error("Erro ao carregar permissões.");
			}
		};

		useImperativeHandle(ref, () => ({ open }));

		const toggle = (value: string) => {
			setSelected((prev) =>
				prev.includes(value)
					? prev.filter((v) => v !== value)
					: [...prev, value],
			);
		};

		const onSubmit = async (values: PerfilFormValues) => {
			try {
				if (editing) {
					const dto: PerfilUpdateDto = {
						nome: values.nome,
						descricao: values.descricao || undefined,
						permissions: selected,
					};
					await APIService.putRequest({
						url: `/perfis/${editing.id}`,
						body: dto,
					});
					toast.success("Perfil atualizado.");
				} else {
					const dto: PerfilCreateDto = {
						nome: values.nome,
						descricao: values.descricao || undefined,
						permissions: selected,
					};
					await APIService.postRequest<Perfil>({ url: "/perfis", body: dto });
					toast.success("Perfil cadastrado.");
				}
				setIsOpen(false);
				onSuccess();
			} catch (error: any) {
				toast.error(getErrorMessage(error, "Erro ao salvar perfil"));
			}
		};

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar Perfil" : "Novo Perfil"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Dados do Perfil
							</h3>
							<div className="space-y-1">
								<Label htmlFor="perfil-nome">Nome *</Label>
								<Input id="perfil-nome" {...register("nome")} />
								{errors.nome && (
									<p className="text-destructive text-xs">
										{errors.nome.message}
									</p>
								)}
							</div>
							<div className="space-y-1">
								<Label htmlFor="perfil-descricao">Descrição</Label>
								<Textarea
									id="perfil-descricao"
									rows={3}
									{...register("descricao")}
								/>
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Permissões
							</h3>
							<div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
								<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
								<p>
									Atenção: permissões de criar/editar (especialmente de usuários
									e perfis) permitem que o usuário conceda acessos a outros.
									Atribua com cuidado a quem confia.
								</p>
							</div>
							{modules.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Nenhuma permissão disponível.
								</p>
							) : (
								<div className="space-y-4">
									{modules.map((module) => (
										<div key={module.module} className="space-y-2">
											<p className="font-medium text-sm">{module.module}</p>
											<div className="grid grid-cols-2 gap-2">
												{module.permissions.map((permission) => {
													const checked = selected.includes(permission.value);
													return (
														<button
															key={permission.value}
															type="button"
															onClick={() => toggle(permission.value)}
															className={cn(
																"flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-left text-sm transition-colors",
																"hover:bg-accent hover:text-accent-foreground",
																checked && "border-primary bg-accent/50",
															)}
														>
															<span
																className={cn(
																	"flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input",
																	checked &&
																		"border-primary bg-primary text-primary-foreground",
																)}
															>
																{checked && <Check className="h-3 w-3" />}
															</span>
															{permission.label}
														</button>
													);
												})}
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? "Salvando..."
									: editing
										? "Salvar"
										: "Cadastrar"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
