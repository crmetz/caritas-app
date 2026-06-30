import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import {
	ConfirmDialog,
	type ConfirmDialogRef,
} from "../../components/ConfirmDialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import APIService, { type PagedResponse } from "../../services/api";
import { ConfiguracaoModal } from "./ConfiguracaoModal";
import type { ConfiguracaoCesta } from "./interface";

const PAGE_SIZE = 10;

export function ConfiguracoesTab() {
	const [configs, setConfigs] = useState<ConfiguracaoCesta[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [busca, setBusca] = useState("");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ConfiguracaoCesta | null>(null);
	const confirmDialogRef = useRef<ConfirmDialogRef>(null);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<
					PagedResponse<ConfiguracaoCesta>
				>({
					url: "/configuracoes-cesta",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: busca.trim() || undefined,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setConfigs(data.items);
				setTotalCount(data.totalCount);
				setPage(pageToLoad);
			} catch {
				toast.error("Erro ao carregar configurações de cesta.");
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[busca, sortDir],
	);

	// Recarrega (página 1) ao mudar busca/ordenação, com debounce.
	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load]);

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
			load(page);
		} catch (err: unknown) {
			const detail = (err as { response?: { data?: { detail?: string } } })
				?.response?.data?.detail;
			toast.error(detail ?? "Erro ao excluir a configuração.");
		}
	};

	const columns: Column<ConfiguracaoCesta>[] = [
		{
			key: "nome",
			header: "Nome",
			sortKey: "nome",
			render: (c) => (
				<span className="font-medium text-foreground">{c.nome}</span>
			),
		},
		{
			key: "composicao",
			header: "Composição",
			render: (c) => (
				<div className="flex flex-wrap gap-1.5">
					{c.itens.map((i) => (
						<Badge
							key={`${c.id}-${i.idAlimento}-${i.tamanho}`}
							variant="outline"
							className="font-normal"
						>
							{i.nomeAlimento} • {i.tamanhoFormatado} • ×{i.quantidadePacotes}
						</Badge>
					))}
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<Input
					className="w-64"
					placeholder="Buscar por nome"
					value={busca}
					onChange={(e) => setBusca(e.target.value)}
				/>
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

			<DataTable
				columns={columns}
				data={configs}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{
					sortKey: "nome",
					sortDir,
					onSort: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
				}}
				isLoading={loading}
				onEdit={(c) => {
					setEditing(c);
					setFormOpen(true);
				}}
				onDelete={handleDelete}
			/>

			<ConfiguracaoModal
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={() => load(page)}
				editing={editing}
			/>
			<ConfirmDialog ref={confirmDialogRef} />
		</div>
	);
}
