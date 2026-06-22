import { Ban, Pencil, Plus, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/SessionProvider";
import APIService, { type PagedResponse } from "@/services/api";
import { Permissions } from "@/constants/permissions";
import {
	type UsuarioModalRef,
	usuarioNomeCompleto,
	type UsuarioResponseDto,
} from "./interface";
import { UsuarioModal } from "./modal";

export default function UsuarioPage() {
	const { session, hasPermission } = useSession();
	const canEdit = hasPermission(Permissions.Usuario.CriarEditar);
	const modalRef = useRef<UsuarioModalRef>(null);
	const [data, setData] = useState<UsuarioResponseDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [termo, setTermo] = useState("");
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalCount: 0,
	});

	const load = useCallback(
		async (page: number, search?: string) => {
			setLoading(true);
			try {
				const result = await APIService.getRequest<PagedResponse<UsuarioResponseDto>>({
					url: "/usuarios",
					params: { page, pageSize: pagination.pageSize, searchTerm: search ?? termo },
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

	const handleSearch = useCallback(
		(newTerm: string) => {
			setTermo(newTerm);
			load(1, newTerm);
		},
		[load],
	);

	useEffect(() => {
		load(1);
	}, [load]);

	const handleDelete = async (usuario: UsuarioResponseDto) => {
		if (usuario.id === session?.id) {
			alert("Não é possível inativar o próprio usuário.");
			return;
		}

		if (!confirm(`Inativar o usuário ${usuarioNomeCompleto(usuario)}?`)) return;

		try {
			await APIService.deleteRequest({ url: `/usuarios/${usuario.id}` });
			toast.success("Usuário inativado.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao inativar usuário.");
		}
	};

	const columns: Column<UsuarioResponseDto>[] = [
		{
			key: "nome",
			header: "Usuário",
			render: (usuario) => (
				<div className="flex items-center gap-2">
					<UserRound className="h-4 w-4 text-muted-foreground" />
					<div>
						<div className="flex items-center gap-2 font-medium">
							{usuarioNomeCompleto(usuario)}
							{usuario.usuarioAdmin && <Badge variant="default">Admin</Badge>}
						</div>
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
				new Date(usuario.criadoEm).toLocaleDateString("pt-BR"),
		},
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (usuario) => {
				if (!usuario.ativo || !canEdit) return null;
				return (
					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => modalRef.current?.open(usuario.id)}
							title="Editar"
							className="h-9 w-9 text-foreground hover:bg-muted"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleDelete(usuario)}
							title="Inativar"
							className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
						>
							<Ban className="h-4 w-4" />
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
					<h1 className="font-semibold text-4xl tracking-tight">Usuários</h1>
					<p className="mt-2 text-muted-foreground">
						Cadastro e manutenção dos acessos ao sistema
					</p>
					<p className="mt-2 inline-flex rounded-md bg-red-100 px-2.5 py-1 text-red-900 text-xs font-medium">
						Você está visualizando usuários das paróquias às quais possui acesso.
					</p>
				</div>
				{canEdit && (
					<Button onClick={() => modalRef.current?.open()}>
						<Plus className="h-5 w-5" />
						Novo Usuário
					</Button>
				)}
			</div>

			<div className="rounded-2xl border bg-card p-5 shadow-sm">
				<div className="w-full">
					<div className="relative">
						<button
							type="button"
							onClick={() => handleSearch(termo)}
							className="-translate-y-1/2 absolute top-1/2 left-4 text-muted-foreground transition-colors hover:text-foreground"
						>
							<Search className="h-5 w-5" />
						</button>
						<Input
							className="pl-12"
							placeholder="Digite o nome do usuário e pressione enter"
							value={termo}
							onChange={(e) => setTermo(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch(termo)}
						/>
					</div>
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
			/>

			<UsuarioModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
