import { ArrowLeft, Plus, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
		render: (usuario) => new Date(usuario.criadoEm).toLocaleDateString("pt-BR"),
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
		<div className="space-y-7">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<button
						type="button"
						className="mb-4 inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar
					</button>
					<h1 className="font-semibold text-4xl tracking-tight">Usuários</h1>
					<p className="mt-2 text-muted-foreground">
						Cadastro e manutenção dos acessos ao sistema
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-5 w-5" />
					Novo Usuário
				</Button>
			</div>

			<div className="rounded-2xl border bg-card p-5 shadow-sm">
				<div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-muted-foreground" />
						<Input className="pl-12" placeholder="Buscar usuário..." />
					</div>
					<Input placeholder="Todos os perfis" readOnly />
					<Input placeholder="Todos os status" readOnly />
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
				onEdit={(usuario) => modalRef.current?.open(usuario)}
				onDelete={handleDelete}
			/>

			<UsuarioModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
