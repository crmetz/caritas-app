import type { FormaMedida } from "../EstoqueAlimentos/interface";

// ── Listagem de entregas às famílias ─────────────────────────────────────────────

export interface EntregaListItem {
	id: number;
	idFamilia: number;
	nomeFamilia: string | null;
	qtdCestas: number;
	qtdItens: number;
	observacao: string | null;
	criadoEm: string;
}

// ── Registro de entrega ──────────────────────────────────────────────────────────

export type ModoLinha = "Cestas" | "Alimentos" | "Roupas";

// Posição de estoque disponível (uma linha de Estoque), de onde se debita uma entrega de item.
export interface PosicaoEstoque {
	id: number; // id da linha de Estoque (único entre alimentos e roupas)
	idItem: number;
	kind: "alimento" | "roupa";
	label: string;
	formaMedida: FormaMedida | null; // só alimentos
	tamanhoBase: number | null; // tamanho do pacote em unidade-base (alimentos)
	validade: string | null;
	lote: string | null;
	disponivel: number;
}

export interface LoteOption {
	idLote: number;
	label: string;
	disponivel: number;
}

// Linhas do formulário.
export interface LinhaCestaForm {
	idLote: number | null;
	quantidade: number | null;
}

export interface LinhaItemForm {
	idPosicao: number | null;
	quantidade: number | null;
}

export const novaLinhaCesta = (): LinhaCestaForm => ({
	idLote: null,
	quantidade: 1,
});

export const novaLinhaItem = (): LinhaItemForm => ({
	idPosicao: null,
	quantidade: 1,
});

// ── Body enviado ao backend ──────────────────────────────────────────────────────

export interface EntregaItemLinha {
	idItem: number;
	quantidade: number;
	tamanhoValor?: number | null;
	tamanhoUnidade?: string | null;
	validade?: string | null;
	lote?: string | null;
}

export interface EntregaCestaLinha {
	idLoteCesta: number;
	quantidade: number;
}

export interface EntregaBody {
	idFamilia: number;
	itens: EntregaItemLinha[];
	cestas: EntregaCestaLinha[];
	observacao?: string | null;
}
