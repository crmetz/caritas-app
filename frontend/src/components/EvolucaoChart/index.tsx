import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { SituacaoGeralFamilia } from "@/pages/Atendimento/interface";
import type {
	LineChartCardProps,
	SituacaoStepChartProps,
	StackedSituacaoChartProps,
} from "./interface";

export const SITUACAO_ORDER: SituacaoGeralFamilia[] = [
	"Critica",
	"Estavel",
	"EmEvolucao",
	"Superada",
];

export const SITUACAO_LABEL: Record<SituacaoGeralFamilia, string> = {
	Critica: "Crítica",
	Estavel: "Estável",
	EmEvolucao: "Em evolução",
	Superada: "Superada",
};

export const SITUACAO_COLOR: Record<SituacaoGeralFamilia, string> = {
	Critica: "#dc2626",
	Estavel: "#d97706",
	EmEvolucao: "#2563eb",
	Superada: "#16a34a",
};

/** Nível ordinal da situação (1=Crítica ... 4=Superada) para plotar a trajetória. */
export function situacaoNivel(situacao: SituacaoGeralFamilia | null): number | null {
	if (!situacao) return null;
	return SITUACAO_ORDER.indexOf(situacao) + 1;
}

function ChartCard({
	title,
	children,
	highlight,
}: {
	title: string;
	children: React.ReactNode;
	highlight?: boolean;
}) {
	return (
		<div
			className={
				highlight
					? "rounded-xl border-2 border-primary/30 bg-card p-4 shadow-sm"
					: "rounded-xl border bg-card p-4 shadow-sm"
			}
		>
			<h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
			{children}
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
			{message}
		</div>
	);
}

const axisProps = {
	stroke: "currentColor",
	fontSize: 12,
	tickLine: false,
	axisLine: false,
	className: "text-muted-foreground",
};

export function LineChartCard({
	title,
	data,
	color = "#2563eb",
	valueFormatter,
	height = 240,
	emptyMessage = "Sem dados para exibir.",
}: LineChartCardProps) {
	const hasData = data.some((d) => d.value != null);
	return (
		<ChartCard title={title}>
			{hasData ? (
				<ResponsiveContainer width="100%" height={height}>
					<LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
						<XAxis dataKey="label" {...axisProps} />
						<YAxis
							{...axisProps}
							width={48}
							tickFormatter={(v) =>
								valueFormatter ? valueFormatter(Number(v)) : String(v)
							}
						/>
						<Tooltip
							formatter={(v) =>
								valueFormatter ? valueFormatter(Number(v)) : String(v)
							}
							contentStyle={{ borderRadius: 12, fontSize: 12 }}
						/>
						<Line
							type="monotone"
							dataKey="value"
							stroke={color}
							strokeWidth={2}
							dot={{ r: 3 }}
							connectNulls
						/>
					</LineChart>
				</ResponsiveContainer>
			) : (
				<EmptyState message={emptyMessage} />
			)}
		</ChartCard>
	);
}

export function SituacaoStepChart({
	data,
	height = 280,
	emptyMessage = "Sem situação registrada ainda.",
}: SituacaoStepChartProps) {
	const hasData = data.some((d) => d.nivel != null);
	return (
		<ChartCard title="Situação geral ao longo do tempo" highlight>
			{hasData ? (
				<ResponsiveContainer width="100%" height={height}>
					<LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
						<XAxis dataKey="label" {...axisProps} />
						<YAxis
							{...axisProps}
							width={92}
							domain={[0.5, 4.5]}
							ticks={[1, 2, 3, 4]}
							tickFormatter={(v) =>
								SITUACAO_LABEL[SITUACAO_ORDER[Number(v) - 1]] ?? ""
							}
						/>
						<Tooltip
							formatter={(v) =>
								SITUACAO_LABEL[SITUACAO_ORDER[Number(v) - 1]] ?? String(v)
							}
							contentStyle={{ borderRadius: 12, fontSize: 12 }}
						/>
						<Line
							type="stepAfter"
							dataKey="nivel"
							stroke="#2563eb"
							strokeWidth={2.5}
							dot={{ r: 4 }}
							connectNulls
						/>
					</LineChart>
				</ResponsiveContainer>
			) : (
				<EmptyState message={emptyMessage} />
			)}
		</ChartCard>
	);
}

export function StackedSituacaoChart({
	data,
	height = 260,
	emptyMessage = "Sem atendimentos para consolidar.",
}: StackedSituacaoChartProps) {
	const hasData = data.length > 0;
	return (
		<ChartCard title="Evolução da situação geral das famílias" highlight>
			{hasData ? (
				<ResponsiveContainer width="100%" height={height}>
					<BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
						<XAxis dataKey="periodo" {...axisProps} />
						<YAxis {...axisProps} width={36} allowDecimals={false} />
						<Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
						<Legend wrapperStyle={{ fontSize: 12 }} />
						{SITUACAO_ORDER.map((s) => (
							<Bar
								key={s}
								dataKey={s}
								name={SITUACAO_LABEL[s]}
								stackId="situacao"
								fill={SITUACAO_COLOR[s]}
							/>
						))}
					</BarChart>
				</ResponsiveContainer>
			) : (
				<EmptyState message={emptyMessage} />
			)}
		</ChartCard>
	);
}
