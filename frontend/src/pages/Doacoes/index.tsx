import { HeartHandshake } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import APIService, { type PagedResponse } from "../../services/api";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import { NovaDoacaoModal } from "./NovaDoacaoModal";
import type { DoacaoListItem } from "./interface";

const PAGE_SIZE = 10;
const ALL = "all";

type SortKey = "data" | "doador";

function DoacoesPage() {
	const [data, setData] = useState<DoacaoListItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [busca, setBusca] = useState("");
	const [tipo, setTipo] = useState<string>(ALL);
	const [sortKey, setSortKey] = useState<SortKey>("data");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [modalOpen, setModalOpen] = useState(false);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const result = await APIService.getRequest<
					PagedResponse<DoacaoListItem>
				>({
					url: "/doacoes",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: busca.trim() || undefined,
						tipo: tipo !== ALL ? tipo : undefined,
						sortKey,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setData(result.items);
				setTotalCount(result.totalCount);
				setPage(pageToLoad);
			} catch {
				toast.error("Erro ao carregar as doações.");
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[busca, tipo, sortKey, sortDir],
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

	const columns: Column<DoacaoListItem>[] = [
		{
			key: "criadoEm",
			header: "Data",
			sortKey: "data",
			render: (d) => formatDateBR(d.criadoEm.slice(0, 10)),
		},
		{
			key: "nomeDoador",
			header: "Doador",
			sortKey: "doador",
			render: (d) => d.nomeDoador ?? "—",
		},
		{
			key: "tipo",
			header: "Tipo",
			render: (d) => (
				<Badge variant="outline">
					{d.tipo === "CestasFechadas" ? "Cestas" : "Itens"}
				</Badge>
			),
		},
		{
			key: "quantidade",
			header: "Quantidade",
			align: "right",
			render: (d) =>
				d.tipo === "CestasFechadas"
					? `${d.quantidade} cesta(s)`
					: `${d.quantidade} item(ns)`,
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Doações
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Registro de tudo que é doado — itens avulsos ou cestas fechadas.
					</p>
				</div>
				<Button onClick={() => setModalOpen(true)}>
					<HeartHandshake className="mr-1.5 h-4 w-4" />
					Nova doação
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Input
					className="w-64"
					placeholder="Buscar por doador"
					value={busca}
					onChange={(e) => setBusca(e.target.value)}
				/>
				<Select value={tipo} onValueChange={setTipo}>
					<SelectTrigger className="w-44" aria-label="Tipo">
						<SelectValue placeholder="Tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>Todos os tipos</SelectItem>
						<SelectItem value="Itens">Itens</SelectItem>
						<SelectItem value="CestasFechadas">Cestas</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<DataTable
				columns={columns}
				data={data}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{ sortKey, sortDir, onSort: toggleSort }}
				isLoading={loading}
			/>

			<NovaDoacaoModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => load(1)}
			/>
		</div>
	);
}

export default DoacoesPage;
