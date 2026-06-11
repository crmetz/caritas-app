import { Church, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
		<div className="space-y-7">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 className="font-semibold text-4xl tracking-tight">Paróquias</h1>
					<p className="mt-2 text-muted-foreground">
						Cadastro e manutenção das paróquias atendidas
					</p>
					<p className="mt-2 inline-flex rounded-md bg-red-100 px-2.5 py-1 text-red-900 text-xs font-medium">
						Você está visualizando os dados das paróquias às quais possui acesso.
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-5 w-5" />
					Nova Paróquia
				</Button>
			</div>

			<div className="rounded-2xl border bg-card p-5 shadow-sm">
				<div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-muted-foreground" />
						<Input className="pl-12" placeholder="Buscar paróquia..." />
					</div>
					<Input placeholder="Todas as cidades" readOnly />
					<Input placeholder="Todos os bairros" readOnly />
				</div>
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
