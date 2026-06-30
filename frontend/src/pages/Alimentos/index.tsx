import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import {
	ConfirmDialog,
	type ConfirmDialogRef,
} from "../../components/ConfirmDialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import APIService, { type PagedResponse } from "../../services/api";
import type { Alimento } from "../EstoqueAlimentos/interface";
import { AlimentoFormDialog } from "./modal";

const PAGE_SIZE = 10;

const FORMA_LABEL: Record<string, string> = {
	Peso: "Peso (g/kg/t)",
	Volume: "Volume (ml/L)",
	Unidade: "Unidade",
};

type SortKey = "nome" | "forma";

export function GenerosTab() {
	const [alimentos, setAlimentos] = useState<Alimento[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [busca, setBusca] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("nome");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Alimento | null>(null);
	const confirmDialogRef = useRef<ConfirmDialogRef>(null);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<PagedResponse<Alimento>>({
					url: "/itens/alimentos",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: busca.trim() || undefined,
						sortKey,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setAlimentos(data.items);
				setTotalCount(data.totalCount);
				setPage(pageToLoad);
			} catch {
				toast.error("Erro ao carregar alimentos.");
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[busca, sortKey, sortDir],
	);

	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load]);

	const toggleSort = (key: string) => {
		const k = key as SortKey;
		if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(k);
			setSortDir("asc");
		}
	};

	const handleDelete = async (alimento: Alimento) => {
		const confirmed = await confirmDialogRef.current?.open({
			title: "Excluir alimento",
			description: `Excluir o alimento "${alimento.descricao}"? Esta ação não pode ser desfeita.`,
			confirmLabel: "Excluir",
		});
		if (!confirmed) return;
		try {
			await APIService.deleteRequest({ url: `/itens/${alimento.id}` });
			toast.success("Alimento excluído.");
			load(page);
		} catch (err: unknown) {
			const detail = (err as { response?: { data?: { detail?: string } } })
				?.response?.data?.detail;
			toast.error(detail ?? "Erro ao excluir o alimento. Tente novamente.");
		}
	};

	const columns: Column<Alimento>[] = [
		{
			key: "descricao",
			header: "Nome",
			sortKey: "nome",
			render: (a) => (
				<span className="font-medium text-foreground">{a.descricao}</span>
			),
		},
		{
			key: "formaMedida",
			header: "Forma de medida",
			sortKey: "forma",
			render: (a) => FORMA_LABEL[a.formaMedida] ?? a.formaMedida,
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
					Novo alimento
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={alimentos}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{ sortKey, sortDir, onSort: toggleSort }}
				isLoading={loading}
				onEdit={(a) => {
					setEditing(a);
					setFormOpen(true);
				}}
				onDelete={handleDelete}
				canDelete={(a) => !a.emUso}
			/>

			<AlimentoFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				onSuccess={() => load(page)}
				editing={editing}
			/>
			<ConfirmDialog ref={confirmDialogRef} />
		</div>
	);
}
