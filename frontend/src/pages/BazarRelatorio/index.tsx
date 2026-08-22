import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Ban, FileDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/SessionProvider";
import { Permissions } from "@/constants/permissions";
import APIService, { type PagedResponse } from "@/services/api";
import { CancelarVendaModal } from "@/pages/BazarHistorico/CancelarVendaModal";
import type {
	CancelarVendaModalRef,
	VendaBazar,
} from "@/pages/BazarHistorico/interface";
import { FORMA_PAGAMENTO_LABELS } from "@/pages/BazarHistorico/interface";

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

const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const firstOfMonth = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

interface RelatorioBazar {
	totalPecasVendidas: number;
	totalArrecadado: number;
	vendasPorCategoria: {
		categoria: string;
		quantidade: number;
		total: number;
	}[];
}

export default function BazarRelatorioPage() {
	const { hasPermission } = useSession();
	const canRegistrarVenda = hasPermission(Permissions.Bazar.RegistrarVenda);
	const cancelarRef = useRef<CancelarVendaModalRef>(null);
	const [dataInicio, setDataInicio] = useState(firstOfMonth());
	const [dataFim, setDataFim] = useState(today());
	const [relatorio, setRelatorio] = useState<RelatorioBazar | null>(null);
	const [loading, setLoading] = useState(false);
	const [vendas, setVendas] = useState<VendaBazar[]>([]);
	const [vendasPagination, setVendasPagination] = useState({
		page: 1,
		pageSize: 15,
		totalCount: 0,
	});

	const loadVendas = useCallback(
		async (page: number, inicio: string, fim: string) => {
			try {
				const result = await APIService.getRequest<PagedResponse<VendaBazar>>({
					url: "/bazar/vendas",
					params: { page, pageSize: 15, dataInicio: inicio, dataFim: fim },
				});
				setVendas(result.items);
				setVendasPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar vendas.");
			}
		},
		[],
	);

	const gerar = async () => {
		setLoading(true);
		try {
			const [resultado] = await Promise.all([
				APIService.getRequest<RelatorioBazar>({
					url: "/bazar/relatorio",
					params: { dataInicio, dataFim },
				}),
				loadVendas(1, dataInicio, dataFim),
			]);
			setRelatorio(resultado);
		} catch {
			toast.error("Erro ao gerar relatório.");
		} finally {
			setLoading(false);
		}
	};

	const baixarPdf = async () => {
		if (!relatorio) return;

		const todasVendas =
			vendasPagination.totalCount > 0
				? await APIService.getRequest<PagedResponse<VendaBazar>>({
						url: "/bazar/vendas",
						params: {
							page: 1,
							pageSize: vendasPagination.totalCount,
							dataInicio,
							dataFim,
						},
					}).then((r) => r.items)
				: [];

		const doc = new jsPDF();
		doc.setFontSize(16);
		doc.text("Relatório do Bazar", 14, 18);
		doc.setFontSize(10);
		doc.text(`Período: ${dataInicio} a ${dataFim}`, 14, 25);

		doc.setFontSize(12);
		doc.text(`Peças vendidas: ${relatorio.totalPecasVendidas}`, 14, 35);
		doc.text(
			`Total arrecadado: ${fmtCurrency(relatorio.totalArrecadado)}`,
			14,
			42,
		);

		autoTable(doc, {
			startY: 50,
			head: [["Categoria", "Qtd", "Total"]],
			body: relatorio.vendasPorCategoria.map((v) => [
				v.categoria,
				String(v.quantidade),
				fmtCurrency(v.total),
			]),
		});

		if (todasVendas.length > 0) {
			const finalY = (doc as any).lastAutoTable.finalY + 10;
			doc.setFontSize(12);
			doc.text("Histórico de Vendas", 14, finalY);

			autoTable(doc, {
				startY: finalY + 6,
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
				body: todasVendas.map((v) => [
					fmtDateTime(v.dataVenda),
					v.compradorNome +
						(v.compradorCpf
							? `\n${v.compradorCpf}`
							: v.compradorIdentificacaoAlternativa
								? `\nID: ${v.compradorIdentificacaoAlternativa}`
								: ""),
					v.registradoPor,
					v.itens.map((i) => `${i.pecaCategoria} x${i.quantidade}`).join(", "),
					FORMA_PAGAMENTO_LABELS[v.formaPagamento],
					fmtCurrency(v.valorTotal),
					v.cancelado ? `Cancelada — ${v.motivoCancelamento ?? ""}` : "Ativa",
				]),
			});
		}

		doc.save(`relatorio-bazar-${dataInicio}-a-${dataFim}.pdf`);
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
			render: (v) =>
				v.cancelado || !canRegistrarVenda ? (
					<span className="text-xs text-muted-foreground italic">
						{v.cancelado ? "Cancelada" : "—"}
					</span>
				) : (
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
				),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link to="/bazar">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<h1 className="text-xl font-semibold">Relatório do Bazar</h1>
					<p className="text-sm text-muted-foreground">
						Resumo e histórico de vendas por período
					</p>
				</div>
			</div>

			<div className="rounded-xl border bg-card p-6">
				<div className="grid grid-cols-3 gap-4 items-end">
					<div className="space-y-1">
						<Label>Data início</Label>
						<Input
							type="date"
							value={dataInicio}
							onChange={(e) => setDataInicio(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label>Data fim</Label>
						<Input
							type="date"
							value={dataFim}
							onChange={(e) => setDataFim(e.target.value)}
						/>
					</div>
					<Button onClick={gerar} disabled={loading}>
						{loading ? "Gerando..." : "Gerar Relatório"}
					</Button>
				</div>
			</div>

			{relatorio && (
				<div className="space-y-6">
					<div className="flex justify-end">
						<Button variant="outline" onClick={baixarPdf}>
							<FileDown className="h-4 w-4" />
							Baixar PDF
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-xl border bg-card p-4 space-y-1">
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Peças Vendidas
							</p>
							<p className="text-2xl font-semibold">
								{relatorio.totalPecasVendidas}
							</p>
						</div>
						<div className="rounded-xl border bg-card p-4 space-y-1">
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Total Arrecadado
							</p>
							<p className="text-2xl font-semibold text-green-600">
								{fmtCurrency(relatorio.totalArrecadado)}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="font-medium">Histórico de Vendas</h3>
						<DataTable
							columns={columns}
							data={vendas}
							pagination={{
								...vendasPagination,
								onPageChange: (page) => loadVendas(page, dataInicio, dataFim),
							}}
							isLoading={false}
						/>
					</div>

					<div className="rounded-xl border bg-card overflow-hidden">
						<div className="px-5 py-4 border-b">
							<h3 className="font-medium">Vendas por Categoria</h3>
						</div>
						<table className="w-full text-sm">
							<thead>
								<tr>
									<th className="px-5 py-3 text-left font-semibold text-muted-foreground">
										Categoria
									</th>
									<th className="px-5 py-3 text-right font-semibold text-muted-foreground">
										Qtd
									</th>
									<th className="px-5 py-3 text-right font-semibold text-muted-foreground">
										Total
									</th>
								</tr>
							</thead>
							<tbody>
								{relatorio.vendasPorCategoria.map((v) => (
									<tr key={v.categoria} className="border-t">
										<td className="px-5 py-3">{v.categoria}</td>
										<td className="px-5 py-3 text-right">{v.quantidade}</td>
										<td className="px-5 py-3 text-right font-medium">
											{fmtCurrency(v.total)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<CancelarVendaModal
				ref={cancelarRef}
				onSuccess={() => {
					gerar();
				}}
			/>
		</div>
	);
}
