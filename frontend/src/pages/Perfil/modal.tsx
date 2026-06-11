import { yupResolver } from "@hookform/resolvers/yup";
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
import APIService, { getErrorMessage } from "@/services/api";
import type {
	Perfil,
	PerfilCreateDto,
	PerfilModalProps,
	PerfilModalRef,
	PerfilUpdateDto,
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

		const {
			register,
			handleSubmit,
			reset,
			formState: { errors, isSubmitting },
		} = useForm<PerfilFormValues>({
			resolver: yupResolver(schema),
			defaultValues: EMPTY_FORM,
		});

		const open = (perfil?: Perfil) => {
			if (perfil) {
				setEditing(perfil);
				reset({ nome: perfil.nome, descricao: perfil.descricao ?? "" });
			} else {
				setEditing(null);
				reset(EMPTY_FORM);
			}
			setIsOpen(true);
		};

		useImperativeHandle(ref, () => ({ open }));

		const onSubmit = async (values: PerfilFormValues) => {
			try {
				if (editing) {
					const dto: PerfilUpdateDto = {
						nome: values.nome,
						descricao: values.descricao || undefined,
					};
					await APIService.putRequest({ url: `/perfis/${editing.id}`, body: dto });
					toast.success("Perfil atualizado.");
				} else {
					const dto: PerfilCreateDto = {
						nome: values.nome,
						descricao: values.descricao || undefined,
					};
					await APIService.postRequest<Perfil>({ url: "/perfis", body: dto });
					toast.success("Perfil cadastrado.");
				}
				setIsOpen(false);
				onSuccess();
			} catch(error: any) {
				toast.error(getErrorMessage(error, "Erro ao salvar perfil"));
			}
		};

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editing ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
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
									<p className="text-destructive text-xs">{errors.nome.message}</p>
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

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
