import { PackageCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DataTable } from "../../components/DataTable";
import type { Column } from "../../components/DataTable/interface";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import APIService, { type PagedResponse } from "../../services/api";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import { NovaEntregaModal } from "./NovaEntregaModal";
import type { EntregaListItem } from "./interface";

const PAGE_SIZE = 10;

type SortKey = "data" | "familia";

function resumoEntrega(e: EntregaListItem): string {
	const partes: string[] = [];
	if (e.qtdCestas > 0) partes.push(`${e.qtdCestas} cesta(s)`);
	if (e.qtdItens > 0) partes.push(`${e.qtdItens} item(ns)`);
	return partes.length ? partes.join(" · ") : "—";
}

function EntregasPage() {
	const [data, setData] = useState<EntregaListItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [busca, setBusca] = useState("");
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
					PagedResponse<EntregaListItem>
				>({
					url: "/entregas",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: busca.trim() || undefined,
						sortKey,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setData(result.items);
				setTotalCount(result.totalCount);
				setPage(pageToLoad);
			} catch {
				toast.error("Erro ao carregar as entregas.");
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

	const columns: Column<EntregaListItem>[] = [
		{
			key: "criadoEm",
			header: "Data",
			sortKey: "data",
			render: (e) => formatDateBR(e.criadoEm.slice(0, 10)),
		},
		{
			key: "nomeFamilia",
			header: "Família",
			sortKey: "familia",
			render: (e) => e.nomeFamilia ?? `Família #${e.idFamilia}`,
		},
		{
			key: "resumo",
			header: "Conteúdo",
			render: (e) => resumoEntrega(e),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Entregas às Famílias
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Doações entregues pela Cáritas — cestas, alimentos e roupas.
					</p>
				</div>
				<Button onClick={() => setModalOpen(true)}>
					<PackageCheck className="mr-1.5 h-4 w-4" />
					Nova entrega
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Input
					className="w-64"
					placeholder="Buscar por família"
					value={busca}
					onChange={(e) => setBusca(e.target.value)}
				/>
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

			<NovaEntregaModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => load(1)}
			/>
		</div>
	);
}

export default EntregasPage;
