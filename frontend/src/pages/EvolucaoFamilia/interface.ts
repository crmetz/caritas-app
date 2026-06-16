import type { SituacaoGeralFamilia } from "@/pages/Atendimento/interface";

export interface EvolucaoPonto {
	data: string;
	rendaFamiliarMomento: number | null;
	qtdMembrosTrabalhando: number | null;
	situacaoGeral: SituacaoGeralFamilia | null;
	relato: string;
}

export interface EvolucaoFamilia {
	familiaId: number;
	familiaResponsavelNome: string;
	totalAtendimentos: number;
	primeiroAtendimento: string | null;
	ultimoAtendimento: string | null;
	situacaoAtual: SituacaoGeralFamilia | null;
	rendaInicial: number | null;
	rendaAtual: number | null;
	variacaoRenda: number | null;
	pontos: EvolucaoPonto[];
}
