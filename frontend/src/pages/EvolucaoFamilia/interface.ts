import type { SituacaoGeralFamilia } from "@/pages/Atendimento/interface";
import type { DestinoSaida } from "@/pages/Caixa/interface";
import type { MovimentacaoHistorico } from "@/pages/Estoque/HistoricoTab/interface";

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

export type TipoEventoHistorico = "Atendimento" | "Entrega" | "SaidaCaixa";

/** Evento da linha do tempo da família. Só os campos do `tipo` correspondente vêm preenchidos. */
export interface EventoHistorico {
	tipo: TipoEventoHistorico;
	id: number;
	data: string;
	descricao: string | null;
	responsavel: string | null;
	// Atendimento
	situacaoGeral: SituacaoGeralFamilia | null;
	rendaFamiliarMomento: number | null;
	// Entrega
	qtdCestas: number | null;
	qtdItens: number | null;
	// Saída de caixa
	valor: number | null;
	destino: DestinoSaida | null;
}

export type OrigemCesta = "Montagem" | "Doacao";

export interface EntregaCestaDetalhe {
	idLoteCesta: number;
	quantidade: number;
	origem: OrigemCesta;
	nomeConfiguracao: string | null;
}

export interface EntregaDetalhe {
	id: number;
	idFamilia: number;
	nomeFamilia: string | null;
	observacao: string | null;
	criadoEm: string;
	cestas: EntregaCestaDetalhe[];
	itens: MovimentacaoHistorico[];
}
