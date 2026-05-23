import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import APIService, { type PagedResponse } from "@/services/api";
import {
	type Familia,
	type FamiliaModalRef,
	SITUACAO_MORADIA_LABELS,
	vulnerabilidadeToLabels,
} from "./interface";
import { FamiliaModal } from "./modal";

const columns: Column<Familia>[] = [
	{
		key: "responsavel",
		header: "Responsável",
		render: (f) => f.responsavel?.nome ?? "—",
	},
	{
		key: "situacaoMoradia",
		header: "Moradia",
		render: (f) => SITUACAO_MORADIA_LABELS[f.situacaoMoradia],
	},
	{
		key: "rendaFamiliar",
		header: "Renda Familiar",
		render: (f) =>
			f.rendaFamiliar.toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL",
			}),
	},
	{
		key: "vulnerabilidade",
		header: "Vulnerabilidades",
		render: (f) => {
			const labels = vulnerabilidadeToLabels(f.vulnerabilidade);
			if (labels.length === 0)
				return <span className="text-muted-foreground">Nenhuma</span>;
			return (
				<div className="flex flex-wrap gap-1">
					{labels.map((l) => (
						<Badge key={l} variant="secondary" className="text-xs">
							{l}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		key: "cidade",
		header: "Cidade/UF",
		render: (f) => `${f.cidade} / ${f.estado}`,
	},
];

export default function FamiliaPage() {
	const modalRef = useRef<FamiliaModalRef>(null);
	const [data, setData] = useState<Familia[]>([]);
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
				const result = await APIService.getRequest<PagedResponse<Familia>>({
					url: "/familias",
					params: { page, pageSize: pagination.pageSize },
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar famílias.");
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const handleDelete = async (familia: Familia) => {
		if (!confirm(`Remover a família de ${familia.responsavel?.nome ?? "—"}?`))
			return;
		try {
			await APIService.deleteRequest({ url: `/familias/${familia.id}` });
			toast.success("Família removida.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao remover família.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold">Famílias</h1>
					<p className="text-sm text-muted-foreground">
						Gestão de famílias cadastradas
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-4 w-4" />
					Nova Família
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
				onEdit={(f) => modalRef.current?.open(f)}
				onDelete={handleDelete}
			/>

			<FamiliaModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
