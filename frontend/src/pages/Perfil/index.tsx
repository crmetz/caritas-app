import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import APIService, { type PagedResponse } from "@/services/api";
import type { Perfil, PerfilModalRef } from "./interface";
import { PerfilModal } from "./modal";

export default function PerfilPage() {
	const modalRef = useRef<PerfilModalRef>(null);
	const [data, setData] = useState<Perfil[]>([]);
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
				const result = await APIService.getRequest<PagedResponse<Perfil>>({
					url: "/perfis",
					params: { page, pageSize: pagination.pageSize },
				});
				setData(result.items);
				setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }));
			} catch {
				toast.error("Erro ao carregar perfis.");
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const handleDelete = async (perfil: Perfil) => {
		if (!confirm(`Remover o perfil "${perfil.nome}"?`)) return;
		try {
			await APIService.deleteRequest({ url: `/perfis/${perfil.id}` });
			toast.success("Perfil removido.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao remover perfil.");
		}
	};

	const columns: Column<Perfil>[] = [
		{
			key: "nome",
			header: "Nome",
			render: (perfil) => (
				<div className="flex items-center gap-2 font-medium">
					<ShieldCheck className="h-4 w-4 text-muted-foreground" />
					{perfil.nome}
				</div>
			),
		},
		{
			key: "descricao",
			header: "Descrição",
			render: (perfil) =>
				perfil.descricao ? (
					perfil.descricao
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			key: "estatico",
			header: "Tipo",
			render: (perfil) =>
				perfil.estatico ? (
					<Badge variant="secondary">Estático</Badge>
				) : (
					<Badge variant="outline">Personalizado</Badge>
				),
		},
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (perfil) => {
				if (perfil.estatico) return null;
				return (
					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => modalRef.current?.open(perfil)}
							title="Editar"
							className="h-9 w-9 text-foreground hover:bg-muted"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleDelete(perfil)}
							title="Excluir"
							className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-7">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 className="font-semibold text-4xl tracking-tight">Perfis</h1>
					<p className="mt-2 text-muted-foreground">
						Cadastro e manutenção dos perfis de acesso
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-5 w-5" />
					Novo Perfil
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
			/>

			<PerfilModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
