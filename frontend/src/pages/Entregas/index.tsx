import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PackageCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { DataTable } from "../../components/DataTable";
import APIService, { type PagedResponse } from "../../services/api";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import { NovaEntregaModal } from "./NovaEntregaModal";
import type { EntregaListItem } from "./interface";

const PAGE_SIZE = 10;

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
	const [modalOpen, setModalOpen] = useState(false);

	const fetch = useCallback(async () => {
		setLoading(true);
		try {
			const result = await APIService.getRequest<
				PagedResponse<EntregaListItem>
			>({
				url: "/entregas",
				params: { page, pageSize: PAGE_SIZE },
			});
			setData(result.items);
			setTotalCount(result.totalCount);
		} catch {
			toast.error("Erro ao carregar as entregas.");
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

			<DataTable
				columns={[
					{
						key: "criadoEm",
						header: "Data",
						render: (e) => formatDateBR(e.criadoEm.slice(0, 10)),
					},
					{
						key: "nomeFamilia",
						header: "Família",
						render: (e) => e.nomeFamilia ?? `Família #${e.idFamilia}`,
					},
					{
						key: "resumo",
						header: "Conteúdo",
						render: (e) => resumoEntrega(e),
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

			<NovaEntregaModal
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

export default EntregasPage;
