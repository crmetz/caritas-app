export type SituacaoGeralFamilia =
	| "Critica"
	| "Estavel"
	| "EmEvolucao"
	| "Superada";

export interface Atendimento {
	id: number;
	familiaId: number;
	familiaResponsavelNome: string;
	paroquiaId: number;
	paroquiaNome: string;
	voluntarioId: number;
	voluntarioNome: string;
	dataAtendimento: string;
	relato: string;
	rendaFamiliarMomento: number | null;
	qtdMembrosTrabalhando: number | null;
	necessidadesIdentificadas: string | null;
	encaminhamentosRealizados: string | null;
	situacaoGeral: SituacaoGeralFamilia | null;
	criadoEm: string;
	atualizadoEm: string;
}

export interface AtendimentoCreateDto {
	familiaId: number;
	voluntarioId?: number;
	dataAtendimento: string;
	relato: string;
	rendaFamiliarMomento?: number | null;
	qtdMembrosTrabalhando?: number | null;
	necessidadesIdentificadas?: string;
	encaminhamentosRealizados?: string;
	situacaoGeral?: SituacaoGeralFamilia | null;
}

export interface AtendimentoUpdateDto {
	voluntarioId?: number;
	dataAtendimento: string;
	relato: string;
	rendaFamiliarMomento?: number | null;
	qtdMembrosTrabalhando?: number | null;
	necessidadesIdentificadas?: string;
	encaminhamentosRealizados?: string;
	situacaoGeral?: SituacaoGeralFamilia | null;
}

export const SITUACAO_GERAL_LABELS: Record<SituacaoGeralFamilia, string> = {
	Critica: "Crítica",
	Estavel: "Estável",
	EmEvolucao: "Em evolução",
	Superada: "Superada",
};

export interface SituacaoContagem {
	situacao: SituacaoGeralFamilia | null;
	quantidade: number;
}

export interface EvolucaoParoquiaPonto {
	periodo: string;
	critica: number;
	estavel: number;
	emEvolucao: number;
	superada: number;
}

export interface EvolucaoParoquia {
	totalFamiliasComAtendimento: number;
	distribuicaoAtual: SituacaoContagem[];
	serie: EvolucaoParoquiaPonto[];
}

export interface AtendimentoModalRef {
	open: (atendimento?: Atendimento) => void;
	openView: (atendimento: Atendimento) => void;
}

export interface AtendimentoModalProps {
	onSuccess: () => void;
}
