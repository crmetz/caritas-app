import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Ban, FileDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import APIService, { type PagedResponse } from "@/services/api";
import { CancelarVendaModal } from "./CancelarVendaModal";
import type { CancelarVendaModalRef, VendaBazar } from "./interface";
import { FORMA_PAGAMENTO_LABELS } from "./interface";

const fmtCurrency = (v: number) =>
	v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDateTime = (iso: string) =>
	new Date(iso).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export default function BazarHistoricoPage() {
	const cancelarRef = useRef<CancelarVendaModalRef>(null);
	const { session } = useSession();
	const [data, setData] = useState<VendaBazar[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 15,
		totalCount: 0,
	});

	const load = useCallback(async (page: number) => {
		setLoading(true);
		try {
			const result = await APIService.getRequest<PagedResponse<VendaBazar>>({
				url: "/bazar/vendas",
				params: { page, pageSize: 15 },
			});
			setData(result.items);
			setPagination((prev) => ({
				...prev,
				page,
				totalCount: result.totalCount,
			}));
		} catch {
			toast.error("Erro ao carregar histórico de vendas.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load(1);
	}, [load]);

	const totalVendas = data
		.filter((v) => !v.cancelado)
		.reduce((s, v) => s + v.valorTotal, 0);

	const baixarPdf = async () => {
		if (pagination.totalCount === 0) return;
		try {
			const result = await APIService.getRequest<PagedResponse<VendaBazar>>({
				url: "/bazar/vendas",
				params: { page: 1, pageSize: pagination.totalCount },
			});

			const doc = new jsPDF();
			doc.setFontSize(16);
			doc.text("Bazar — Histórico de Vendas", 14, 18);
			doc.setFontSize(10);
			doc.text(`Gerado em ${fmtDateTime(new Date().toISOString())}`, 14, 25);

			autoTable(doc, {
				startY: 33,
				head: [
					[
						"Data/Hora",
						"Comprador",
						"Registrado por",
						"Peças",
						"Pagamento",
						"Total",
						"Status",
					],
				],
				body: result.items.map((v) => [
					fmtDateTime(v.dataVenda),
					v.compradorNome,
					v.registradoPor,
					v.itens.map((i) => `${i.pecaCategoria} x${i.quantidade}`).join(", "),
					FORMA_PAGAMENTO_LABELS[v.formaPagamento],
					fmtCurrency(v.valorTotal),
					v.cancelado ? `Cancelada — ${v.motivoCancelamento ?? ""}` : "Ativa",
				]),
			});

			doc.save("historico-bazar.pdf");
		} catch {
			toast.error("Erro ao gerar PDF.");
		}
	};

	const columns: Column<VendaBazar>[] = [
		{
			key: "dataVenda",
			header: "Data / Hora",
			render: (v) => (
				<span
					className={`text-sm tabular-nums ${v.cancelado ? "line-through text-muted-foreground" : ""}`}
				>
					{fmtDateTime(v.dataVenda)}
				</span>
			),
		},
		{
			key: "compradorNome",
			header: "Comprador",
			render: (v) => (
				<div className={v.cancelado ? "text-muted-foreground" : ""}>
					<p className="font-medium">{v.compradorNome}</p>
					{v.compradorCpf && (
						<p className="text-xs text-muted-foreground">{v.compradorCpf}</p>
					)}
					{v.compradorIdentificacaoAlternativa && (
						<p className="text-xs text-muted-foreground">
							ID: {v.compradorIdentificacaoAlternativa}
						</p>
					)}
				</div>
			),
		},
		{
			key: "registradoPor",
			header: "Registrado por",
			render: (v) => (
				<div>
					<p
						className={`text-sm ${v.cancelado ? "text-muted-foreground" : ""}`}
					>
						{v.registradoPor}
					</p>
					{v.cancelado && v.canceladoPor && (
						<p className="text-xs text-muted-foreground">
							Cancelado: {v.canceladoPor}
						</p>
					)}
					{v.cancelado && v.motivoCancelamento && (
						<p className="text-xs text-muted-foreground italic">
							"{v.motivoCancelamento}"
						</p>
					)}
				</div>
			),
		},
		{
			key: "itens",
			header: "Peças",
			render: (v) => (
				<div
					className={`space-y-0.5 ${v.cancelado ? "text-muted-foreground line-through" : ""}`}
				>
					{v.itens.map((item, i) => (
						<p key={i} className="text-sm">
							{item.pecaCategoria} × {item.quantidade}{" "}
							<span className="text-muted-foreground">
								({fmtCurrency(item.valorUnitario)})
							</span>
						</p>
					))}
				</div>
			),
		},
		{
			key: "formaPagamento",
			header: "Status",
			render: (v) =>
				v.cancelado ? (
					<Badge variant="outline" className="text-xs text-muted-foreground">
						Cancelada
					</Badge>
				) : (
					<Badge variant={v.formaPagamento === "Pix" ? "default" : "secondary"}>
						{FORMA_PAGAMENTO_LABELS[v.formaPagamento]}
					</Badge>
				),
		},
		{
			key: "valorTotal",
			header: "Total",
			render: (v) => (
				<span
					className={
						v.cancelado
							? "line-through text-muted-foreground"
							: "font-semibold text-green-600"
					}
				>
					{fmtCurrency(v.valorTotal)}
				</span>
			),
		},
		{
			key: "acoes",
			header: "Ações",
			render: (v) => {
				if (v.cancelado) {
					return (
						<span className="text-xs text-muted-foreground italic">
							Cancelada
						</span>
					);
				}
				return (
					<div className="flex justify-end">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => cancelarRef.current?.open(v)}
							title="Cancelar venda e restaurar estoque"
						>
							<Ban className="h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link to="/bazar">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-xl font-semibold">
							Bazar — Histórico de Vendas
						</h1>
						<p className="text-sm text-muted-foreground">
							{pagination.totalCount}{" "}
							{pagination.totalCount === 1
								? "venda registrada"
								: "vendas registradas"}{" "}
							· Total ativo:{" "}
							<span className="font-medium text-green-600">
								{fmtCurrency(totalVendas)}
							</span>
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={baixarPdf}
					disabled={pagination.totalCount === 0}
				>
					<FileDown className="h-4 w-4" />
					Baixar PDF
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data}
				pagination={{ ...pagination, onPageChange: (page) => load(page) }}
				isLoading={loading}
			/>

			<CancelarVendaModal
				ref={cancelarRef}
				onSuccess={() => load(pagination.page)}
			/>
		</div>
	);
}
