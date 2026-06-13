import type { SituacaoGeralFamilia } from "@/pages/Atendimento/interface";

export interface LineChartCardProps {
	title: string;
	data: { label: string; value: number | null }[];
	color?: string;
	valueFormatter?: (value: number) => string;
	height?: number;
	emptyMessage?: string;
}

export interface SituacaoStepPoint {
	label: string;
	nivel: number | null;
	situacao: SituacaoGeralFamilia | null;
}

export interface SituacaoStepChartProps {
	data: SituacaoStepPoint[];
	height?: number;
	emptyMessage?: string;
}

export interface StackedSituacaoPoint {
	periodo: string;
	Critica: number;
	Estavel: number;
	EmEvolucao: number;
	Superada: number;
}

export interface StackedSituacaoChartProps {
	data: StackedSituacaoPoint[];
	height?: number;
	emptyMessage?: string;
}
