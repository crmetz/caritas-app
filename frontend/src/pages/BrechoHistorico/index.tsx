import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Ban, FileDown, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { Permissions } from "@/constants/permissions";
import APIService, { type PagedResponse } from "@/services/api";
import type { SessaoCaixaBrecho } from "@/pages/Brecho/interface";
import { CancelarVendaModal } from "./CancelarVendaModal";
import type { CancelarVendaModalRef, VendaBrecho } from "./interface";
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

export default function BrechoHistoricoPage() {
	const { paroquiaAtual, hasPermission } = useSession();
	const canRegistrarVenda = hasPermission(Permissions.Brecho.RegistrarVenda);
	const cancelarRef = useRef<CancelarVendaModalRef>(null);
	const [sessao, setSessao] = useState<SessaoCaixaBrecho | null | undefined>(
		undefined,
	);
	const [data, setData] = useState<VendaBrecho[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 15,
		totalCount: 0,
	});

	const loadSessao = useCallback(async () => {
		if (!paroquiaAtual) return;
		try {
			const result = await APIService.getRequest<SessaoCaixaBrecho | null>({
				url: "/brecho/caixa/sessao-recente",
				params: { paroquiaId: paroquiaAtual.value },
			});
			setSessao(result);
		} catch {
			setSessao(null);
		}
	}, [paroquiaAtual]);

	const load = useCallback(
		async (page: number, sessaoAtual?: SessaoCaixaBrecho | null) => {
			if (!paroquiaAtual) return;
			const s = sessaoAtual !== undefined ? sessaoAtual : sessao;
			if (!s) return;
			setLoading(true);
			try {
				const result = await APIService.getRequest<PagedResponse<VendaBrecho>>({
					url: "/brecho/vendas",
					params: {
						paroquiaId: paroquiaAtual.value,
						page,
						pageSize: pagination.pageSize,
						abertoDesde: s.abertoEm,
						...(s.fechadoEm ? { ateData: s.fechadoEm } : {}),
					},
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
		},
		[paroquiaAtual, pagination.pageSize, sessao],
	);

	useEffect(() => {
		loadSessao().then(() => {});
	}, [loadSessao]);

	useEffect(() => {
		if (sessao !== undefined) load(1, sessao);
	}, [sessao]); // eslint-disable-line react-hooks/exhaustive-deps

	const totalVendas = data
		.filter((v) => !v.cancelado)
		.reduce((s, v) => s + v.valorTotal, 0);

	const baixarPdf = async () => {
		if (!paroquiaAtual || !sessao || pagination.totalCount === 0) return;
		try {
			const result = await APIService.getRequest<PagedResponse<VendaBrecho>>({
				url: "/brecho/vendas",
				params: {
					paroquiaId: paroquiaAtual.value,
					page: 1,
					pageSize: pagination.totalCount,
					abertoDesde: sessao.abertoEm,
					...(sessao.fechadoEm ? { ateData: sessao.fechadoEm } : {}),
				},
			});

			const doc = new jsPDF();
			doc.setFontSize(16);
			doc.text("Brechó — Histórico de Vendas", 14, 18);
			doc.setFontSize(10);
			doc.text(
				`${paroquiaAtual.label} — Sessão: ${fmtDateTime(sessao.abertoEm)}`,
				14,
				25,
			);

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
					v.itens
						.map((item) => `${item.categoria} x${item.quantidade}`)
						.join(", "),
					FORMA_PAGAMENTO_LABELS[v.formaPagamento],
					fmtCurrency(v.valorTotal),
					v.cancelado ? `Cancelada — ${v.motivoCancelamento ?? ""}` : "Ativa",
				]),
			});

			doc.save(`historico-brecho-${paroquiaAtual.label}.pdf`);
		} catch {
			toast.error("Erro ao gerar PDF.");
		}
	};

	const columns: Column<VendaBrecho>[] = [
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
							{item.categoria} × {item.quantidade}{" "}
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
				if (v.cancelado || !sessao?.aberto || !canRegistrarVenda) {
					return v.cancelado ? (
						<span className="text-xs text-muted-foreground italic">
							Cancelada
						</span>
					) : (
						<span className="text-xs text-muted-foreground italic">—</span>
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
					<Link to="/brecho">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-xl font-semibold">
							Brechó — Histórico de Vendas
						</h1>
						<p className="text-sm text-muted-foreground">
							{paroquiaAtual?.label ?? "—"}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={baixarPdf}
					disabled={!paroquiaAtual || !sessao || pagination.totalCount === 0}
				>
					<FileDown className="h-4 w-4" />
					Baixar PDF
				</Button>
			</div>

			{sessao === undefined ? null : sessao === null ? (
				<div className="flex items-center gap-3 rounded-lg border px-4 py-6 text-center justify-center">
					<p className="text-sm text-muted-foreground">
						Nenhuma sessão de caixa registrada para esta paróquia.
					</p>
				</div>
			) : (
				<>
					<div
						className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
							sessao.aberto
								? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
								: "border-border bg-muted/40"
						}`}
					>
						<div className="space-y-0.5">
							<p className="font-medium">
								{sessao.aberto
									? "Sessão em andamento"
									: "Última sessão encerrada"}
							</p>
							<p className="text-xs text-muted-foreground">
								Aberta em {fmtDateTime(sessao.abertoEm)} por {sessao.abertoPor}
								{sessao.fechadoEm &&
									` · Fechada em ${fmtDateTime(sessao.fechadoEm)} por ${sessao.fechadoPor}`}
							</p>
						</div>
						<div className="flex items-center gap-3">
							{!sessao.aberto && (
								<div className="flex items-center gap-1 text-muted-foreground text-xs">
									<Lock className="h-3 w-3" />
									Caixa fechado
								</div>
							)}
							<div className="text-right">
								<p className="text-xs text-muted-foreground">Total da sessão</p>
								<p className="font-semibold text-green-600">
									{fmtCurrency(totalVendas)}
								</p>
							</div>
						</div>
					</div>

					<DataTable
						columns={columns}
						data={data}
						pagination={{ ...pagination, onPageChange: (page) => load(page) }}
						isLoading={loading}
					/>
				</>
			)}

			<CancelarVendaModal
				ref={cancelarRef}
				onSuccess={() => load(pagination.page)}
			/>
		</div>
	);
}
