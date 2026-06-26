import { yupResolver } from "@hookform/resolvers/yup";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { formatCep } from "@/lib/utils";
import APIService, { getErrorMessage } from "@/services/api";
import type {
	Paroquia,
	ParoquiaCreateDto,
	ParoquiaModalProps,
	ParoquiaModalRef,
	ParoquiaUpdateDto,
} from "./interface";

const schema = yup.object({
	nome: yup.string().required("Nome é obrigatório"),
	endereco: yup.object({
		rua: yup.string().default(""),
		numero: yup.string().default(""),
		cep: yup
			.string()
			.matches(/^\d{5}-\d{3}$/, {
				message: "CEP inválido (00000-000)",
				excludeEmptyString: true,
			})
			.default(""),
		bairro: yup.string().default(""),
		cidade: yup.string().default(""),
	}).default({}),
});

type ParoquiaFormValues = yup.InferType<typeof schema>;

const EMPTY_FORM: ParoquiaFormValues = {
	nome: "",
	endereco: { rua: "", numero: "", cep: "", bairro: "", cidade: "" },
};

export const ParoquiaModal = forwardRef<ParoquiaModalRef, ParoquiaModalProps>(
	({ onSuccess }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Paroquia | null>(null);

		const {
			register,
			handleSubmit,
			reset,
			control,
			formState: { errors, isSubmitting },
		} = useForm<ParoquiaFormValues>({
			resolver: yupResolver(schema),
			defaultValues: EMPTY_FORM,
		});

		const open = (paroquia?: Paroquia) => {
			if (paroquia) {
				setEditing(paroquia);
				reset({
					nome: paroquia.nome,
					endereco: {
						rua: paroquia.endereco?.rua ?? "",
						numero: paroquia.endereco?.numero ?? "",
						cep: paroquia.endereco?.cep ?? "",
						bairro: paroquia.endereco?.bairro ?? "",
						cidade: paroquia.endereco?.cidade ?? "",
					},
				});
			} else {
				setEditing(null);
				reset(EMPTY_FORM);
			}
			setIsOpen(true);
		};

		useImperativeHandle(ref, () => ({ open }));

		const onSubmit = async (values: ParoquiaFormValues) => {
			try {
				if (editing) {
					const dto: ParoquiaUpdateDto = {
						...values,
						enderecoId: editing.enderecoId,
					};
					await APIService.putRequest({
						url: `/paroquias/${editing.id}`,
						body: dto,
					});
					toast.success("Paróquia atualizada.");
				} else {
					await APIService.postRequest<Paroquia>({
						url: "/paroquias",
						body: values as ParoquiaCreateDto,
					});
					toast.success("Paróquia cadastrada.");
				}
				setIsOpen(false);
				onSuccess();
			} catch (ex: unknown) {
				toast.error(getErrorMessage(ex, "Erro ao salvar paróquia."));
			}
		};

		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar Paróquia" : "Nova Paróquia"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Dados da Paróquia
							</h3>
							<div className="space-y-1">
								<Label htmlFor="paroquia-nome">Nome *</Label>
								<Input id="paroquia-nome" {...register("nome")} />
								{errors.nome && (
									<p className="text-destructive text-xs">{errors.nome.message}</p>
								)}
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Endereço
							</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-1 md:col-span-2">
									<Label htmlFor="paroquia-rua">Rua</Label>
									<Input id="paroquia-rua" {...register("endereco.rua")} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-numero">Número</Label>
									<Input id="paroquia-numero" {...register("endereco.numero")} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-bairro">Bairro</Label>
									<Input id="paroquia-bairro" {...register("endereco.bairro")} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-cidade">Cidade</Label>
									<Input id="paroquia-cidade" {...register("endereco.cidade")} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-cep">CEP</Label>
									<Controller
										name="endereco.cep"
										control={control}
										render={({ field }) => (
											<Input
												id="paroquia-cep"
												placeholder="00000-000"
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(formatCep(e.target.value))
												}
											/>
										)}
									/>
									{errors.endereco?.cep && (
										<p className="text-destructive text-xs">
											{errors.endereco.cep.message}
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
