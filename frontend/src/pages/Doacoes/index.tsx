import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { HeartHandshake } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DataTable } from "../../components/DataTable";
import APIService, { type PagedResponse } from "../../services/api";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import { NovaDoacaoModal } from "./NovaDoacaoModal";
import type { DoacaoListItem } from "./interface";

const PAGE_SIZE = 10;

function DoacoesPage() {
	const [data, setData] = useState<DoacaoListItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	const fetch = useCallback(async () => {
		setLoading(true);
		try {
			const result = await APIService.getRequest<PagedResponse<DoacaoListItem>>(
				{
					url: "/doacoes",
					params: { page, pageSize: PAGE_SIZE },
				},
			);
			setData(result.items);
			setTotalCount(result.totalCount);
		} catch {
			toast.error("Erro ao carregar as doações.");
		} finally {
			setLoading(false);
		}
	}, [page]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return (
		<div className="space-y-6">
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

			<DataTable
				columns={[
					{
						key: "criadoEm",
						header: "Data",
						render: (d) => formatDateBR(d.criadoEm.slice(0, 10)),
					},
					{
						key: "nomeDoador",
						header: "Doador",
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
				]}
				data={data}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					totalCount,
					onPageChange: setPage,
				}}
				isLoading={loading}
			/>

			<NovaDoacaoModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => {
					setPage(1);
					fetch();
				}}
			/>
		</div>
	);
}

export default DoacoesPage;
