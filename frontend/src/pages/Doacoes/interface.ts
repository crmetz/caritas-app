import type { FormaMedida, Medida } from "@/components/QuantityInput/quantity";

// ── Listagem unificada de doações ────────────────────────────────────────────────

export type TipoDoacao = "Itens" | "CestasFechadas";

export interface DoacaoListItem {
	id: number;
	tipo: TipoDoacao;
	idDoador: number;
	nomeDoador: string | null;
	quantidade: number; // Itens: nº de linhas; CestasFechadas: nº de cestas
	observacao: string | null;
	criadoEm: string;
}

// ── Registro de doação ───────────────────────────────────────────────────────────

export type ModoDoacao = "Itens" | "Cesta";

export type TipoItem = "Alimento" | "Roupa";

// Opção do seletor de itens (vem de /itens/select), com tipo e forma de medida para o front decidir
// o modo do campo de quantidade.
export interface ItemSelectOption {
	value: number;
	label: string | null;
	tipo: TipoItem;
	formaMedida: FormaMedida | null;
}

// Uma linha de item doado (espelha LinhaMovimentacaoDto do backend).
export interface LinhaItemDoacao {
	idItem: number | null;
	quantidade: number | null; // nº de unidades doadas
	tamanho: Medida | null; // tamanho do pacote (alimentos); null p/ roupas ou não informado
	validade: string; // opcional (yyyy-mm-dd)
	lote: string; // opcional
}

export function novaLinhaItem(): LinhaItemDoacao {
	return {
		idItem: null,
		quantidade: 1,
		tamanho: null,
		validade: "",
		lote: "",
	};
}

export interface DoacaoItensBody {
	idDoador: number;
	observacao?: string | null;
	itens: {
		idItem: number;
		quantidade: number;
		tamanhoValor?: number | null;
		tamanhoUnidade?: string | null;
		validade?: string | null;
		lote?: string | null;
	}[];
}

export interface DoacaoCestaBody {
	idDoador: number;
	quantidade: number;
	observacao?: string | null;
}
