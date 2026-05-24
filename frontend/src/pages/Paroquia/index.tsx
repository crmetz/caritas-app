import { Church, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Button } from "@/components/ui/button";
import APIService, { type PagedResponse } from "@/services/api";
import type { Paroquia, ParoquiaModalRef } from "./interface";
import { ParoquiaModal } from "./modal";

const columns: Column<Paroquia>[] = [
	{
		key: "nome",
		header: "Nome",
		render: (paroquia) => (
			<div className="flex items-center gap-2 font-medium">
				<Church className="h-4 w-4 text-muted-foreground" />
				{paroquia.nome}
			</div>
		),
	},
	{
		key: "endereco",
		header: "Endereço",
		render: (paroquia) => {
			const endereco = paroquia.endereco;
			if (!endereco) return <span className="text-muted-foreground">-</span>;

			const parts = [endereco.rua, endereco.numero, endereco.bairro].filter(
				Boolean,
			);
			return parts.length > 0 ? (
				parts.join(", ")
			) : (
				<span className="text-muted-foreground">-</span>
			);
		},
	},
	{
		key: "cidade",
		header: "Cidade",
		render: (paroquia) =>
			paroquia.endereco?.cidade || (
				<span className="text-muted-foreground">-</span>
			),
	},
	{
		key: "cep",
		header: "CEP",
		render: (paroquia) =>
			paroquia.endereco?.cep || (
				<span className="text-muted-foreground">-</span>
			),
	},
];

export default function ParoquiaPage() {
	const modalRef = useRef<ParoquiaModalRef>(null);
	const [data, setData] = useState<Paroquia[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalCount: 0,
	});

	const load = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const result = await APIService.getRequest<PagedResponse<Paroquia>>({
					url: "/paroquias",
					params: { page, pageSize: pagination.pageSize },
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar paróquias.");
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const handleDelete = async (paroquia: Paroquia) => {
		if (!confirm(`Remover a paróquia ${paroquia.nome}?`)) return;

		try {
			await APIService.deleteRequest({ url: `/paroquias/${paroquia.id}` });
			toast.success("Paróquia removida.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao remover paróquia.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-xl">Paróquias</h1>
					<p className="text-muted-foreground text-sm">
						Cadastro e manutenção das paróquias atendidas
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-4 w-4" />
					Nova Paróquia
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data}
				pagination={{
					...pagination,
					onPageChange: (page) => load(page),
				}}
				isLoading={loading}
				onEdit={(paroquia) => modalRef.current?.open(paroquia)}
				onDelete={handleDelete}
			/>

			<ParoquiaModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
