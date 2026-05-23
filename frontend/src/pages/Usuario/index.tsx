import { Plus, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import APIService, { type PagedResponse } from "@/services/api";
import {
	type Usuario,
	type UsuarioModalRef,
	usuarioNomeCompleto,
} from "./interface";
import { UsuarioModal } from "./modal";

const columns: Column<Usuario>[] = [
	{
		key: "nome",
		header: "Usuário",
		render: (usuario) => (
			<div className="flex items-center gap-2">
				<UserRound className="h-4 w-4 text-muted-foreground" />
				<div>
					<div className="font-medium">{usuarioNomeCompleto(usuario)}</div>
					<div className="text-muted-foreground text-xs">{usuario.email}</div>
				</div>
			</div>
		),
	},
	{
		key: "telefone",
		header: "Telefone",
		render: (usuario) =>
			usuario.telefone || <span className="text-muted-foreground">-</span>,
	},
	{
		key: "perfil",
		header: "Perfil",
		render: (usuario) =>
			usuario.perfil?.nome ??
			(usuario.perfilId ? (
				`Perfil #${usuario.perfilId}`
			) : (
				<span className="text-muted-foreground">-</span>
			)),
	},
	{
		key: "ativo",
		header: "Status",
		render: (usuario) => (
			<Badge variant={usuario.ativo ? "secondary" : "outline"}>
				{usuario.ativo ? "Ativo" : "Inativo"}
			</Badge>
		),
	},
	{
		key: "dataCriacao",
		header: "Criado em",
		render: (usuario) =>
			new Date(usuario.dataCriacao).toLocaleDateString("pt-BR"),
	},
];

export default function UsuarioPage() {
	const modalRef = useRef<UsuarioModalRef>(null);
	const [data, setData] = useState<Usuario[]>([]);
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
				const result = await APIService.getRequest<PagedResponse<Usuario>>({
					url: "/usuarios",
					params: { page, pageSize: pagination.pageSize },
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar usuários.");
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const handleDelete = async (usuario: Usuario) => {
		if (!confirm(`Inativar o usuário ${usuarioNomeCompleto(usuario)}?`)) return;

		try {
			await APIService.deleteRequest({ url: `/usuarios/${usuario.id}` });
			toast.success("Usuário inativado.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao inativar usuário.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-xl">Usuários</h1>
					<p className="text-muted-foreground text-sm">
						Cadastro e manutenção dos acessos ao sistema
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-4 w-4" />
					Novo Usuário
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
				onEdit={(usuario) => modalRef.current?.open(usuario)}
				onDelete={handleDelete}
			/>

			<UsuarioModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
