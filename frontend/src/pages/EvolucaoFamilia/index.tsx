import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
	LineChartCard,
	SITUACAO_COLOR,
	SITUACAO_LABEL,
	SituacaoStepChart,
	situacaoNivel,
} from "@/components/EvolucaoChart";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import APIService from "@/services/api";
import type { EvolucaoFamilia } from "./interface";

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatLabel(value: string) {
	return new Date(value).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
	});
}

function formatCurrency(value: number) {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EvolucaoFamiliaPage() {
	const { familiaId } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<EvolucaoFamilia | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const result = await APIService.getRequest<EvolucaoFamilia>({
				url: `/atendimentos/evolucao/${familiaId}`,
			});
			setData(result);
		} catch {
			toast.error("Erro ao carregar evolução da família.");
		} finally {
			setLoading(false);
		}
	}, [familiaId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <LoadingSpinner />;
	if (!data) return null;

	const pontos = data.pontos;
	const situacaoData = pontos.map((p) => ({
		label: formatLabel(p.data),
		nivel: situacaoNivel(p.situacaoGeral),
		situacao: p.situacaoGeral,
	}));
	const rendaData = pontos.map((p) => ({
		label: formatLabel(p.data),
		value: p.rendaFamiliarMomento,
	}));
	const membrosData = pontos.map((p) => ({
		label: formatLabel(p.data),
		value: p.qtdMembrosTrabalhando,
	}));

	const periodo =
		data.primeiroAtendimento && data.ultimoAtendimento
			? `${formatDate(data.primeiroAtendimento)} — ${formatDate(data.ultimoAtendimento)}`
			: "Sem atendimentos";
	const membrosAtual = [...pontos]
		.reverse()
		.find((p) => p.qtdMembrosTrabalhando != null)?.qtdMembrosTrabalhando;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-semibold">
						Evolução — {data.familiaResponsavelNome}
					</h1>
					<p className="text-sm text-muted-foreground">{periodo}</p>
				</div>
				{data.situacaoAtual && (
					<Badge
						style={{ backgroundColor: SITUACAO_COLOR[data.situacaoAtual] }}
						className="text-white"
					>
						{SITUACAO_LABEL[data.situacaoAtual]}
					</Badge>
				)}
			</div>

			{/* Resumo */}
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Atendimentos
					</p>
					<p className="mt-1 text-2xl font-semibold">{data.totalAtendimentos}</p>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Variação de renda
					</p>
					<div className="mt-1 flex items-center gap-2">
						<p className="text-2xl font-semibold">
							{data.variacaoRenda != null
								? formatCurrency(data.variacaoRenda)
								: "—"}
						</p>
						{data.variacaoRenda != null && data.variacaoRenda !== 0 && (
							<span
								className={
									data.variacaoRenda > 0
										? "text-green-600"
										: "text-destructive"
								}
							>
								{data.variacaoRenda > 0 ? (
									<TrendingUp className="h-5 w-5" />
								) : (
									<TrendingDown className="h-5 w-5" />
								)}
							</span>
						)}
					</div>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Membros trabalhando (atual)
					</p>
					<p className="mt-1 text-2xl font-semibold">
						{membrosAtual ?? "—"}
					</p>
				</div>
			</div>

			{/* Destaque: situação geral */}
			<SituacaoStepChart data={situacaoData} />

			{/* Renda e membros */}
			<div className="grid gap-4 lg:grid-cols-2">
				<LineChartCard
					title="Renda familiar ao longo do tempo"
					data={rendaData}
					color="#16a34a"
					valueFormatter={formatCurrency}
				/>
				<LineChartCard
					title="Membros trabalhando ao longo do tempo"
					data={membrosData}
					color="#2563eb"
				/>
			</div>

			{/* Timeline */}
			<div className="rounded-xl border bg-card p-4 shadow-sm">
				<h3 className="mb-3 text-sm font-semibold">Histórico de atendimentos</h3>
				{pontos.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						Nenhum atendimento registrado para esta família.
					</p>
				) : (
					<ol className="space-y-3">
						{[...pontos].reverse().map((p, i) => (
							<li
								key={`${p.data}-${i}`}
								className="flex gap-3 border-l-2 border-border pl-4"
							>
								<div className="flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-sm font-medium">
											{formatDate(p.data)}
										</span>
										{p.situacaoGeral && (
											<Badge
												style={{
													backgroundColor: SITUACAO_COLOR[p.situacaoGeral],
												}}
												className="text-white"
											>
												{SITUACAO_LABEL[p.situacaoGeral]}
											</Badge>
										)}
										{p.rendaFamiliarMomento != null && (
											<span className="text-xs text-muted-foreground">
												Renda: {formatCurrency(p.rendaFamiliarMomento)}
											</span>
										)}
									</div>
									<p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
										{p.relato}
									</p>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}
