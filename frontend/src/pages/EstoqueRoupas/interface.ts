// ── API enums ──────────────────────────────────────────────────────────────────

export type TipoOperacao = "Entrada" | "Saida";
export type OrigemMovimentacao =
	| "Doacao"
	| "MontagemCesta"
	| "Ajuste"
	| "Descarte"
	| "Utilizacao"
	| "Entrega";
export type CategoriaRoupa =
	| "Calca"
	| "Calcado"
	| "Acessorio"
	| "Camisa"
	| "Casaco"
	| "Outro";
export type FaixaEtaria = "Bebe" | "Infantil" | "Adulto";
export type Genero = "Masculino" | "Feminino" | "Unissex";
export type Estacao = "Inverno" | "Verao";
export type CondicaoRoupa = "Novo" | "Usado";

export const CATEGORIAS_ROUPA: CategoriaRoupa[] = [
	"Calca",
	"Calcado",
	"Acessorio",
	"Camisa",
	"Casaco",
	"Outro",
];

export const CATEGORIAS_LABEL: Record<CategoriaRoupa, string> = {
	Calca: "Calça",
	Calcado: "Calçado",
	Acessorio: "Acessório",
	Camisa: "Camisa",
	Casaco: "Casaco",
	Outro: "Outro",
};

export const FAIXAS_ETARIAS: FaixaEtaria[] = ["Bebe", "Infantil", "Adulto"];

export const FAIXAS_LABEL: Record<FaixaEtaria, string> = {
	Bebe: "Bebê",
	Infantil: "Infantil",
	Adulto: "Adulto",
};

export const GENEROS: Genero[] = ["Masculino", "Feminino", "Unissex"];

export const ESTACOES: Estacao[] = ["Inverno", "Verao"];

export const ESTACOES_LABEL: Record<Estacao, string> = {
	Inverno: "Inverno",
	Verao: "Verão",
};

export const CONDICOES_ROUPA: CondicaoRoupa[] = ["Novo", "Usado"];

// ── API response types ─────────────────────────────────────────────────────────

export interface RoupaEstoqueItem {
	id: number;
	idItem: number;
	descricao: string;
	categoria: CategoriaRoupa;
	tamanho: string | null;
	condicao: CondicaoRoupa | null;
	lote: string | null;
	quantidade: number;
}

export interface CreateRoupaBody {
	descricao: string;
	categoria: CategoriaRoupa;
	faixaEtaria?: FaixaEtaria | null;
	genero?: Genero | null;
	tamanho?: string | null;
	estacao?: Estacao | null;
	condicao?: CondicaoRoupa | null;
	codigo?: string | null;
}

export interface CreateRoupaResponse {
	id: number;
	descricao: string;
	criadoEm: string;
	atualizadoEm: string;
}

export interface CreateMovimentacaoBody {
	idItem: number;
	validade?: string | null;
	lote?: string | null;
	tipoOperacao: TipoOperacao;
	quantidade: number;
	origemTipo: OrigemMovimentacao;
	origemId?: number | null;
	observacao?: string | null;
}

// ── Badge helpers ──────────────────────────────────────────────────────────────

export type ConditionStatus = "novo" | "usado";

const CONDITION_BADGE: Record<
	CondicaoRoupa,
	{ label: string; className: string }
> = {
	Novo: {
		label: "Novo",
		className: "bg-green-500/10 text-green-700 border-green-500/25",
	},
	Usado: {
		label: "Usado",
		className: "bg-blue-500/10 text-blue-700 border-blue-500/25",
	},
};

export function getConditionBadgeVariant(condicao: CondicaoRoupa): {
	label: string;
	className: string;
} {
	return CONDITION_BADGE[condicao];
}
