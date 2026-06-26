import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
import APIService, { type PagedResponse } from "../../services/api";
import type { ConfiguracaoCesta } from "./interface";
import { ConfiguracaoModal } from "./ConfiguracaoModal";

export function ConfiguracoesTab() {
	const [configs, setConfigs] = useState<ConfiguracaoCesta[]>([]);
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ConfiguracaoCesta | null>(null);

	const confirmDialogRef = useRef<ConfirmDialogRef>(null);

	const fetch = async () => {
		setLoading(true);

		try {
			const data = await APIService.getRequest<
				PagedResponse<ConfiguracaoCesta>
			>({
				url: "/configuracoes-cesta",
				params: { page: 1, pageSize: 100 },
			});

			setConfigs(data.items);
		} catch {
			toast.error("Erro ao carregar configurações de cesta.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetch();
	}, []);

	const handleDelete = async (configuracao: ConfiguracaoCesta) => {
		const confirmed = await confirmDialogRef.current?.open({
			title: "Excluir configuração",
			description: `Excluir a configuração "${configuracao.nome}"? Esta ação não pode ser desfeita.`,
			confirmLabel: "Excluir",
		});

		if (!confirmed) return;

		try {
			await APIService.deleteRequest({
				url: `/configuracoes-cesta/${configuracao.id}`,
			});

			toast.success("Configuração excluída.");
			fetch();
		} catch (err: unknown) {
			const detail = (err as { response?: { data?: { detail?: string } } })
				?.response?.data?.detail;

			toast.error(detail ?? "Erro ao excluir a configuração.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					onClick={() => {
						setEditing(null);
						setFormOpen(true);
					}}
				>
					<Plus className="mr-1.5 h-4 w-4" />
					Nova configuração
				</Button>
			</div>

			<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
				{loading ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Carregando...
					</div>
				) : configs.length === 0 ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Nenhuma configuração cadastrada.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Nome</TableHead>
								<TableHead>Composição</TableHead>
								<TableHead className="w-24 pr-4 text-right">
									Ações
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{configs.map((c) => (
								<TableRow key={c.id}>
									<TableCell className="pl-4 font-medium text-foreground">
										{c.nome}
									</TableCell>

									<TableCell>
										<div className="flex flex-wrap gap-1.5">
											{c.itens.map((i) => (
												<Badge
													key={`${c.id}-${i.idAlimento}-${i.tamanho}`}
													variant="outline"
													className="font-normal"
												>
													{i.nomeAlimento} • {i.tamanhoFormatado} • ×
													{i.quantidadePacotes}
												</Badge>
											))}
										</div>
									</TableCell>

									<TableCell className="pr-4">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditing(c);
													setFormOpen(true);
												}}
											>
												<Pencil className="h-4 w-4" />
											</Button>

											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(c)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<ConfiguracaoModal
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={fetch}
				editing={editing}
			/>

			<ConfirmDialog ref={confirmDialogRef} />
		</div>
	);
}