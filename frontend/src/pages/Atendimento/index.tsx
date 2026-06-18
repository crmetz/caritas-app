import { ChevronDown, ChevronUp, LineChart, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import {
	SITUACAO_COLOR,
	SITUACAO_LABEL,
	StackedSituacaoChart,
} from "@/components/EvolucaoChart";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useSession } from "@/components/SessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Permissions } from "@/constants/permissions";
import APIService, { type PagedResponse } from "@/services/api";
import {
	type Atendimento,
	type AtendimentoModalRef,
	type EvolucaoParoquia,
	SITUACAO_GERAL_LABELS,
} from "./interface";
import { AtendimentoModal } from "./modal";

interface SelectOption {
	value: number;
	label: string;
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const baseColumns: Column<Atendimento>[] = [
	{
		key: "familiaResponsavelNome",
		header: "Família",
		render: (a) => a.familiaResponsavelNome || "—",
	},
	{
		key: "dataAtendimento",
		header: "Data",
		render: (a) => formatDate(a.dataAtendimento),
	},
	{
		key: "voluntarioNome",
		header: "Voluntário",
		render: (a) => a.voluntarioNome || "—",
	},
	{
		key: "situacaoGeral",
		header: "Situação",
		render: (a) =>
			a.situacaoGeral ? (
				<Badge variant="secondary">
					{SITUACAO_GERAL_LABELS[a.situacaoGeral]}
				</Badge>
			) : (
				<span className="text-muted-foreground text-xs">Não avaliada</span>
			),
	},
	{
		key: "rendaFamiliarMomento",
		header: "Renda",
		render: (a) =>
			a.rendaFamiliarMomento != null
				? a.rendaFamiliarMomento.toLocaleString("pt-BR", {
						style: "currency",
						currency: "BRL",
					})
				: "—",
	},
];

export default function AtendimentoPage() {
	const modalRef = useRef<AtendimentoModalRef>(null);
	const navigate = useNavigate();
	const { paroquiaAtual, hasPermission } = useSession();
	const canEdit = hasPermission(Permissions.Atendimento.CriarEditar);
	const canViewEvolucao = hasPermission(
		Permissions.Atendimento.VisualizarEvolucao,
	);
	const [data, setData] = useState<Atendimento[]>([]);
	const [loading, setLoading] = useState(false);
	const [familias, setFamilias] = useState<SelectOption[]>([]);
	const [familiaFiltro, setFamiliaFiltro] = useState<number | null>(null);
	const [situacaoFiltro, setSituacaoFiltro] = useState<string>("all");
	const [evolucao, setEvolucao] = useState<EvolucaoParoquia | null>(null);
	const [painelAberto, setPainelAberto] = useState(true);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalCount: 0,
	});

	const columns: Column<Atendimento>[] = [
		...baseColumns,
		...(canViewEvolucao
			? [
					{
						key: "evolucao",
						header: "Evolução",
						render: (a: Atendimento) => (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
								onClick={() => navigate(`/familias/${a.familiaId}/evolucao`)}
								title="Ver evolução da família"
							>
								<LineChart className="h-4 w-4" />
							</Button>
						),
					},
				]
			: []),
	];

	useEffect(() => {
		APIService.getRequest<SelectOption[]>({ url: "/familias/select" })
			.then(setFamilias)
			.catch(() => {});
	}, [paroquiaAtual]);

	const loadEvolucao = useCallback(() => {
		if (!canViewEvolucao) return;
		APIService.getRequest<EvolucaoParoquia>({
			url: "/atendimentos/evolucao-paroquia",
		})
			.then(setEvolucao)
			.catch(() => {});
	}, [canViewEvolucao]);

	useEffect(() => {
		loadEvolucao();
	}, [loadEvolucao, paroquiaAtual]);

	const limparFiltros = () => {
		setFamiliaFiltro(null);
		setSituacaoFiltro("all");
	};

	const load = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const params: Record<string, unknown> = {
					page,
					pageSize: pagination.pageSize,
				};
				if (paroquiaAtual) params.paroquiaId = paroquiaAtual.value;
				if (familiaFiltro != null) params.familiaId = familiaFiltro;
				if (situacaoFiltro !== "all") params.situacaoGeral = situacaoFiltro;

				const result = await APIService.getRequest<PagedResponse<Atendimento>>({
					url: "/atendimentos",
					params,
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar atendimentos.");
			} finally {
				setLoading(false);
			}
		},
		[pagination.pageSize, paroquiaAtual, familiaFiltro, situacaoFiltro],
	);

	useEffect(() => {
		const timer = setTimeout(() => load(1), 400);
		return () => clearTimeout(timer);
	}, [load]);

	const handleEdit = (atendimento: Atendimento) => {
		modalRef.current?.open(atendimento);
	};

	const handleDelete = async (atendimento: Atendimento) => {
		if (!confirm("Remover este atendimento?")) return;
		try {
			await APIService.deleteRequest({
				url: `/atendimentos/${atendimento.id}`,
			});
			toast.success("Atendimento removido.");
			load(pagination.page);
			loadEvolucao();
		} catch {
			toast.error("Erro ao remover atendimento.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold">Atendimentos</h1>
					<p className="text-sm text-muted-foreground">
						Registro de visitas e evolução das famílias
					</p>
				</div>
				{canEdit && (
					<Button onClick={() => modalRef.current?.open()}>
						<Plus className="h-4 w-4" />
						Novo Atendimento
					</Button>
				)}
			</div>

			{evolucao && evolucao.totalFamiliasComAtendimento > 0 && (
				<div className="space-y-3">
					<button
						type="button"
						onClick={() => setPainelAberto((prev) => !prev)}
						className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent/40"
					>
						<div>
							<p className="text-sm font-semibold">Evolução da paróquia</p>
							<p className="text-xs text-muted-foreground">
								{evolucao.totalFamiliasComAtendimento} famílias acompanhadas
							</p>
						</div>
						{painelAberto ? (
							<ChevronUp className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						)}
					</button>

					{painelAberto && (
						<div className="grid gap-4 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<StackedSituacaoChart
									data={evolucao.serie.map((p) => ({
										periodo: p.periodo,
										Critica: p.critica,
										Estavel: p.estavel,
										EmEvolucao: p.emEvolucao,
										Superada: p.superada,
									}))}
								/>
							</div>
							<div className="rounded-xl border bg-card p-4 shadow-sm">
								<h3 className="mb-3 text-sm font-semibold">Situação atual</h3>
								<ul className="space-y-2">
									{evolucao.distribuicaoAtual.map((d) => (
										<li
											key={d.situacao ?? "nao-avaliada"}
											className="flex items-center justify-between text-sm"
										>
											<span className="flex items-center gap-2">
												<span
													className="h-3 w-3 rounded-full"
													style={{
														backgroundColor: d.situacao
															? SITUACAO_COLOR[d.situacao]
															: "#9ca3af",
													}}
												/>
												{d.situacao
													? SITUACAO_LABEL[d.situacao]
													: "Não avaliada"}
											</span>
											<span className="font-semibold">{d.quantidade}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<SearchableSelect
					className="w-64"
					value={familiaFiltro}
					onChange={setFamiliaFiltro}
					options={familias}
					allOptionLabel="Todas as famílias"
					searchPlaceholder="Buscar família..."
					emptyMessage="Nenhuma família encontrada."
				/>

				<Select value={situacaoFiltro} onValueChange={setSituacaoFiltro}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Situação geral" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as situações</SelectItem>
						{Object.entries(SITUACAO_GERAL_LABELS).map(([k, v]) => (
							<SelectItem key={k} value={k}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button variant="outline" onClick={limparFiltros}>
					<X className="h-4 w-4" />
					Limpar filtros
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data}
				pagination={{
					...pagination,
					onPageChange: (page) => load(page),
				}}
				isLoading={loading}
				onEdit={canEdit ? handleEdit : undefined}
				onView={(a) => modalRef.current?.openView(a)}
				onDelete={canEdit ? handleDelete : undefined}
			/>

			<AtendimentoModal
				ref={modalRef}
				onSuccess={() => {
					load(pagination.page);
					loadEvolucao();
				}}
			/>
		</div>
	);
}
