// ── API types ──────────────────────────────────────────────────────────────────

export type TipoOperacao = "Entrada" | "Saida";
export type OrigemMovimentacao =
	| "Doacao"
	| "MontagemCesta"
	| "Ajuste"
	| "Descarte"
	| "Entrega";

// Lógica de quantidade/medida centralizada no componente QuantityInput. Re-exportada aqui por
// compatibilidade com os imports existentes deste módulo.
import {
	baseUnidade,
	type FormaMedida,
	type Medida,
	parseMedida,
	UNIDADES_POR_FORMA,
} from "@/components/QuantityInput/quantity";

export {
	baseUnidade,
	type FormaMedida,
	type Medida,
	parseMedida,
	UNIDADES_POR_FORMA,
};

// Motivos de saída de estoque (alimentos e roupas). value = OrigemMovimentacao do back-end.
// Entregas a famílias são registradas em "Entregas" (não aparecem aqui).
export const MOTIVOS_SAIDA_ESTOQUE: {
	value: OrigemMovimentacao;
	label: string;
}[] = [
	{ value: "Descarte", label: "Descarte" },
	{ value: "Ajuste", label: "Ajuste / outro" },
];

// Catálogo: um gênero alimentício (Arroz, Feijão...).
export interface Alimento {
	id: number;
	descricao: string;
	formaMedida: FormaMedida;
	emUso: boolean; // vinculado a estoque/movimentação/cesta → não pode ser excluído
	criadoEm: string;
	atualizadoEm: string;
}

export interface AlimentoEstoqueItem {
	id: number;
	idItem: number;
	descricao: string;
	formaMedida: FormaMedida;
	tamanho: number | null;
	tamanhoFormatado: string | null;
	validade: string | null;
	lote: string | null;
	quantidade: number; // nº de pacotes
	atualizadoEm: string;
}

export interface ResumoTipoAlimento {
	idAlimento: number;
	nome: string;
	formaMedida: FormaMedida;
	totalBase: number;
	textoFormatado: string;
}

export interface CreateAlimentoBody {
	descricao: string;
	formaMedida: FormaMedida;
}

export interface CreateMovimentacaoBody {
	idItem: number;
	tamanhoValor?: number | null;
	tamanhoUnidade?: string | null;
	validade?: string | null;
	lote?: string | null;
	tipoOperacao: TipoOperacao;
	quantidade: number;
	origemTipo: OrigemMovimentacao;
	origemId?: number | null;
	observacao?: string | null;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

export type ExpiryStatus = "expired" | "critical" | "warning" | "ok";

export function getExpiryStatus(
	expiryISO: string,
	today: Date = new Date(),
): ExpiryStatus {
	const expiry = new Date(expiryISO + "T00:00:00");
	const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const diffDays = Math.floor(
		(expiry.getTime() - t.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diffDays < 0) return "expired";
	if (diffDays <= 7) return "critical";
	if (diffDays <= 30) return "warning";
	return "ok";
}

export function daysUntil(expiryISO: string, today: Date = new Date()): number {
	const expiry = new Date(expiryISO + "T00:00:00");
	const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.floor((expiry.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateBR(iso: string): string {
	if (!iso) return "";
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

export function todayISO(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
