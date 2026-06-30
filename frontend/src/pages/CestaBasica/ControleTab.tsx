import { PackageMinus } from "lucide-react";
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
import { BaixaCestaModal } from "./BaixaCestaModal";
import { statusLote, type LoteCesta } from "./interface";

interface Props {
	refreshSignal: number;
}

const PAGE_SIZE = 10;
const ALL = "all";

type SortKey = "data" | "quantidade" | "saldo";

export function ControleTab({ refreshSignal }: Props) {
	const [lotes, setLotes] = useState<LoteCesta[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [busca, setBusca] = useState("");
	const [origem, setOrigem] = useState<string>(ALL);
	const [status, setStatus] = useState<string>(ALL);
	const [sortKey, setSortKey] = useState<SortKey>("data");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [loading, setLoading] = useState(false);
	const [baixaLote, setBaixaLote] = useState<LoteCesta | null>(null);
	const reqIdRef = useRef(0);

	const load = useCallback(
		async (pageToLoad: number) => {
			const reqId = ++reqIdRef.current;
			setLoading(true);
			try {
				const data = await APIService.getRequest<PagedResponse<LoteCesta>>({
					url: "/lotes-cesta",
					params: {
						page: pageToLoad,
						pageSize: PAGE_SIZE,
						busca: busca.trim() || undefined,
						origem: origem !== ALL ? origem : undefined,
						status: status !== ALL ? status : undefined,
						sortKey,
						sortDir,
					},
				});
				if (reqId !== reqIdRef.current) return;
				setLotes(data.items);
				setTotalCount(data.totalCount);
				setPage(pageToLoad);
			} catch {
				toast.error("Erro ao carregar o controle de cestas.");
			} finally {
				if (reqId === reqIdRef.current) setLoading(false);
			}
		},
		[busca, origem, status, sortKey, sortDir],
	);

	// Recarrega ao mudar filtros/ordenação (debounce) e quando uma montagem/baixa sinaliza refresh.
	useEffect(() => {
		const t = setTimeout(() => load(1), 400);
		return () => clearTimeout(t);
	}, [load, refreshSignal]);

	const toggleSort = (key: string) => {
		const k = key as SortKey;
		if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(k);
			setSortDir("asc");
		}
	};

	const columns: Column<LoteCesta>[] = [
		{
			key: "origem",
			header: "Origem",
			render: (l) => (
				<Badge variant="outline">
					{l.origem === "Montagem" ? "Montada" : "Recebida"}
				</Badge>
			),
		},
		{
			key: "descricao",
			header: "Descrição",
			render: (l) =>
				l.origem === "Montagem"
					? (l.nomeConfiguracao ?? "Cesta montada")
					: `Doador: ${l.nomeDoador ?? "—"}`,
		},
		{
			key: "status",
			header: "Status",
			render: (l) => {
				const s = statusLote(l);
				return (
					<Badge variant="outline" className={`font-normal ${s.className}`}>
						{s.label}
					</Badge>
				);
			},
		},
		{
			key: "quantidade",
			header: "Quantidade",
			align: "right",
			sortKey: "quantidade",
			render: (l) => l.quantidade,
		},
		{
			key: "saldo",
			header: "Saldo",
			align: "right",
			sortKey: "saldo",
			render: (l) => l.quantidadeDisponivel,
		},
		{
			key: "validade",
			header: "Validade mais próxima",
			render: (l) =>
				l.validadeMaisProxima
					? formatDateBR(l.validadeMaisProxima.slice(0, 10))
					: "—",
		},
		{
			key: "criadoEm",
			header: "Data",
			sortKey: "data",
			render: (l) => formatDateBR(l.criadoEm.slice(0, 10)),
		},
		{
			key: "acoes",
			header: "Ações",
			align: "right",
			render: (l) => (
				<Button
					variant="ghost"
					size="sm"
					disabled={l.quantidadeDisponivel <= 0}
					onClick={() => setBaixaLote(l)}
				>
					<PackageMinus className="mr-1.5 h-4 w-4" />
					Baixa
				</Button>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<Input
						className="w-64"
						placeholder="Buscar por configuração ou doador"
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
					/>
					<Select value={origem} onValueChange={setOrigem}>
						<SelectTrigger className="w-40" aria-label="Origem">
							<SelectValue placeholder="Origem" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todas as origens</SelectItem>
							<SelectItem value="Montagem">Montada</SelectItem>
							<SelectItem value="Doacao">Recebida</SelectItem>
						</SelectContent>
					</Select>
					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger className="w-40" aria-label="Status">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos os status</SelectItem>
							<SelectItem value="disponivel">Disponível</SelectItem>
							<SelectItem value="parcial">Parcial</SelectItem>
							<SelectItem value="esgotada">Esgotada</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<p className="text-xs text-muted-foreground">
					Cestas recebidas são registradas em <strong>Doações</strong>.
				</p>
			</div>

			<DataTable
				columns={columns}
				data={lotes}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: load,
				}}
				sort={{ sortKey, sortDir, onSort: toggleSort }}
				isLoading={loading}
			/>

			<BaixaCestaModal
				lote={baixaLote}
				onOpenChange={(open) => !open && setBaixaLote(null)}
				onSuccess={() => load(page)}
			/>
		</div>
	);
}
