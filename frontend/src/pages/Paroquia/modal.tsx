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
	Paroquia,
	ParoquiaCreateDto,
	ParoquiaModalProps,
	ParoquiaModalRef,
	ParoquiaUpdateDto,
} from "./interface";

const INITIAL_FORM: ParoquiaCreateDto = {
	nome: "",
	endereco: {
		rua: "",
		numero: "",
		cep: "",
		bairro: "",
		cidade: "",
	},
};

export const ParoquiaModal = forwardRef<ParoquiaModalRef, ParoquiaModalProps>(
	({ onSuccess }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [editing, setEditing] = useState<Paroquia | null>(null);
		const [loading, setLoading] = useState(false);
		const [form, setForm] = useState<ParoquiaCreateDto>(INITIAL_FORM);

		const setField = (field: keyof ParoquiaCreateDto, value: string) =>
			setForm((prev) => ({ ...prev, [field]: value }));

		const setEnderecoField = (
			field: keyof ParoquiaCreateDto["endereco"],
			value: string,
		) =>
			setForm((prev) => ({
				...prev,
				endereco: { ...prev.endereco, [field]: value },
			}));

		const open = (paroquia?: Paroquia) => {
			if (paroquia) {
				setEditing(paroquia);
				setForm({
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
					const dto: ParoquiaUpdateDto = {
						...form,
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
						body: form,
					});
					toast.success("Paróquia cadastrada.");
				}

				setIsOpen(false);
				onSuccess();
			} catch {
				toast.error("Erro ao salvar paróquia.");
			} finally {
				setLoading(false);
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

					<form onSubmit={handleSubmit} className="space-y-6">
						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Dados da Paróquia
							</h3>
							<div className="space-y-1">
								<Label htmlFor="paroquia-nome">Nome *</Label>
								<Input
									id="paroquia-nome"
									required
									value={form.nome}
									onChange={(event) => setField("nome", event.target.value)}
								/>
							</div>
						</section>

						<section className="space-y-4">
							<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
								Endereço
							</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-1 md:col-span-2">
									<Label htmlFor="paroquia-rua">Rua</Label>
									<Input
										id="paroquia-rua"
										value={form.endereco.rua ?? ""}
										onChange={(event) =>
											setEnderecoField("rua", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-numero">Número</Label>
									<Input
										id="paroquia-numero"
										value={form.endereco.numero ?? ""}
										onChange={(event) =>
											setEnderecoField("numero", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-bairro">Bairro</Label>
									<Input
										id="paroquia-bairro"
										value={form.endereco.bairro ?? ""}
										onChange={(event) =>
											setEnderecoField("bairro", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-cidade">Cidade</Label>
									<Input
										id="paroquia-cidade"
										value={form.endereco.cidade ?? ""}
										onChange={(event) =>
											setEnderecoField("cidade", event.target.value)
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="paroquia-cep">CEP</Label>
									<Input
										id="paroquia-cep"
										placeholder="00000-000"
										value={form.endereco.cep ?? ""}
										onChange={(event) =>
											setEnderecoField("cep", event.target.value)
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
