import { Ban, Church, Pencil, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import APIService, { getErrorMessage, type PagedResponse } from "@/services/api";
import type { Paroquia, ParoquiaModalRef } from "./interface";
import { ParoquiaModal } from "./modal";

const CIDADES = [{ value: "Caxias do Sul", label: "Caxias do Sul" }];

export default function ParoquiaPage() {
	const { refreshSession } = useSession();
	const modalRef = useRef<ParoquiaModalRef>(null);
	const [data, setData] = useState<Paroquia[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalCount: 0,
	});

	const [nomeFiltro, setNomeFiltro] = useState("");
	const [cidadeFiltro, setCidadeFiltro] = useState("all");
	const [bairroFiltro, setBairroFiltro] = useState("");

	const limparFiltros = () => {
		setNomeFiltro("");
		setCidadeFiltro("all");
		setBairroFiltro("");
	};

	const load = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const params: Record<string, unknown> = {
					page,
					pageSize: pagination.pageSize,
				};
				if (nomeFiltro.trim()) params.nome = nomeFiltro.trim();
				if (cidadeFiltro !== "all") params.cidade = cidadeFiltro;
				if (bairroFiltro.trim()) params.bairro = bairroFiltro.trim();

				const result = await APIService.getRequest<PagedResponse<Paroquia>>({
					url: "/paroquias",
					params,
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch (ex: unknown) {
				toast.error(getErrorMessage(ex, "Erro ao carregar paróquias"));
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize, nomeFiltro, cidadeFiltro, bairroFiltro],
	);

	useEffect(() => {
		const timer = setTimeout(() => load(1), 400);
		return () => clearTimeout(timer);
	}, [load]);

	const handleDelete = async (paroquia: Paroquia) => {
		if (!confirm(`Inativar a paróquia ${paroquia.nome}?`)) return;

		try {
			await APIService.deleteRequest({ url: `/paroquias/${paroquia.id}` });
			toast.success("Paróquia inativada.");
			await refreshSession();
			load(pagination.page);
		} catch (ex: unknown) {
			toast.error(getErrorMessage(ex, "Erro ao inativar paróquia."));
		}
	};

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
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (paroquia) => {
				if (!paroquia.ativa) return null;
				return (
					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => modalRef.current?.open(paroquia)}
							title="Editar"
							className="h-9 w-9 text-foreground hover:bg-muted"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleDelete(paroquia)}
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
				<div className="flex flex-wrap items-center gap-3">
					<Input
						className="w-72"
						placeholder="Buscar por nome"
						value={nomeFiltro}
						onChange={(e) => setNomeFiltro(e.target.value)}
					/>

					<Select value={cidadeFiltro} onValueChange={setCidadeFiltro}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Cidade" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todas as cidades</SelectItem>
							{CIDADES.map((c) => (
								<SelectItem key={c.value} value={c.value}>
									{c.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Input
						className="w-48"
						placeholder="Bairro"
						value={bairroFiltro}
						onChange={(e) => setBairroFiltro(e.target.value)}
					/>

					<Button variant="outline" onClick={limparFiltros}>
						<X className="h-4 w-4" />
						Limpar filtros
					</Button>
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

			<ParoquiaModal ref={modalRef} onSuccess={() => load(pagination.page)} />
		</div>
	);
}
