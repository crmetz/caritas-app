import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import {
	ConfirmDialog,
	type ConfirmDialogRef,
} from "../../components/ConfirmDialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../components/ui/tooltip";
import APIService from "../../services/api";
import type { Alimento } from "../EstoqueAlimentos/interface";
import { AlimentoFormDialog } from "./modal";

const FORMA_LABEL: Record<string, string> = {
	Peso: "Peso (g/kg/t)",
	Volume: "Volume (ml/L)",
	Unidade: "Unidade",
};

export function GenerosTab() {
	const [alimentos, setAlimentos] = useState<Alimento[]>([]);
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Alimento | null>(null);

	const confirmDialogRef = useRef<ConfirmDialogRef>(null);

	const fetch = async () => {
		setLoading(true);

		try {
			const data = await APIService.getRequest<Alimento[]>({
				url: "/itens/alimentos",
			});

			setAlimentos(data);
		} catch {
			toast.error("Erro ao carregar alimentos.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetch();
	}, []);

	const openNew = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (a: Alimento) => {
		setEditing(a);
		setFormOpen(true);
	};

	const handleDelete = async (alimento: Alimento) => {
		const confirmed = await confirmDialogRef.current?.open({
			title: "Excluir alimento",
			description: `Excluir o alimento "${alimento.descricao}"? Esta ação não pode ser desfeita.`,
			confirmLabel: "Excluir",
		});

		if (!confirmed) return;

		try {
			await APIService.deleteRequest({
				url: `/itens/${alimento.id}`,
			});

			toast.success("Alimento excluído.");
			fetch();
		} catch (err: unknown) {
			const detail = (err as { response?: { data?: { detail?: string } } })
				?.response?.data?.detail;

			toast.error(detail ?? "Erro ao excluir o alimento. Tente novamente.");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					Gêneros alimentícios e como cada um é medido.
				</p>

				<Button onClick={openNew}>
					<Plus className="mr-1.5 h-4 w-4" />
					Novo alimento
				</Button>
			</div>

			<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
				{loading ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Carregando...
					</div>
				) : alimentos.length === 0 ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Nenhum alimento cadastrado.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Nome</TableHead>
								<TableHead>Forma de medida</TableHead>
								<TableHead className="w-24 pr-4 text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{alimentos.map((a) => (
								<TableRow key={a.id}>
									<TableCell className="pl-4 font-medium text-foreground">
										{a.descricao}
									</TableCell>

									<TableCell className="text-muted-foreground">
										{FORMA_LABEL[a.formaMedida] ?? a.formaMedida}
									</TableCell>

									<TableCell className="pr-4">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => openEdit(a)}
											>
												<Pencil className="h-4 w-4" />
											</Button>

											<Tooltip>
												<TooltipTrigger asChild>
													<span className="inline-flex">
														<Button
															variant="ghost"
															size="icon"
															disabled={a.emUso}
															onClick={() => handleDelete(a)}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</span>
												</TooltipTrigger>

												<TooltipContent>
													{a.emUso
														? "Este alimento não pode ser excluído porque está sendo utilizado em outros registros do sistema."
														: "Excluir"}
												</TooltipContent>
											</Tooltip>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<AlimentoFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={fetch}
				editing={editing}
			/>

			<ConfirmDialog ref={confirmDialogRef} />
		</div>
	);
}
