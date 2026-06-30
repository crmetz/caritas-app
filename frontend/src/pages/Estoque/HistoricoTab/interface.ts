import type {
	OrigemMovimentacao,
	TipoOperacao,
} from "../../EstoqueAlimentos/interface";

export type { OrigemMovimentacao, TipoOperacao };

export type TipoItem = "Alimento" | "Roupa";

export const TIPOS_ITEM: TipoItem[] = ["Alimento", "Roupa"];

export interface MovimentacaoHistorico {
	id: number;
	idItem: number;
	descricao: string | null;
	tipoItem: TipoItem | null;
	tamanho: number | null;
	validade: string | null;
	lote: string | null;
	tipoOperacao: TipoOperacao;
	quantidade: number;
	origemTipo: OrigemMovimentacao;
	origemId: number | null;
	observacao: string | null;
	criadoEm: string;
}

export const ORIGEM_LABEL: Record<OrigemMovimentacao, string> = {
	Doacao: "Doação",
	MontagemCesta: "Montagem de cesta",
	Ajuste: "Ajuste / outro",
	Descarte: "Descarte",
	Entrega: "Entrega",
};

export const ORIGENS: OrigemMovimentacao[] = [
	"Doacao",
	"MontagemCesta",
	"Ajuste",
	"Descarte",
	"Entrega",
];

export const TIPOS_OPERACAO: { value: TipoOperacao; label: string }[] = [
	{ value: "Entrada", label: "Entrada" },
	{ value: "Saida", label: "Saída" },
];
