// ── Configuração de cesta (template) ─────────────────────────────────────────────

export interface ItemConfigResponse {
	idAlimento: number;
	nomeAlimento: string;
	tamanho: number;
	tamanhoFormatado: string;
	quantidadePacotes: number;
}

export interface ConfiguracaoCesta {
	id: number;
	nome: string;
	itens: ItemConfigResponse[];
}

export interface ItemConfigBody {
	idAlimento: number;
	tamanhoValor: number;
	tamanhoUnidade: string;
	quantidadePacotes: number;
}

export interface ConfiguracaoCestaBody {
	nome: string;
	itens: ItemConfigBody[];
}

// ── Montagem (proposta + confirmação) ─────────────────────────────────────────────

export interface LoteDisponivel {
	validade: string | null;
	lote: string | null;
	saldo: number;
	vencido: boolean;
	qtdSugerida: number;
}

export interface PropostaLinha {
	idAlimento: number;
	nomeAlimento: string;
	tamanho: number;
	tamanhoFormatado: string;
	pacotesNecessarios: number;
	pacotesFaltantes: number;
	lotesDisponiveis: LoteDisponivel[];
}

export interface MontagemProposta {
	idConfiguracaoCesta: number;
	quantidade: number;
	linhas: PropostaLinha[];
}

export interface AlocacaoConfirmada {
	idAlimento: number;
	tamanho: number;
	validade: string | null;
	lote: string | null;
	qtdPacotes: number;
}

export interface MontagemConfirmarBody {
	idConfiguracaoCesta: number;
	quantidade: number;
	alocacoes: AlocacaoConfirmada[];
	observacao?: string | null;
}

// ── Controle de cestas (lotes) ────────────────────────────────────────────────────

export type OrigemCesta = "Montagem" | "Doacao";

export interface LoteCesta {
	id: number;
	origem: OrigemCesta;
	idConfiguracaoCesta: number | null;
	nomeConfiguracao: string | null;
	idDoador: number | null;
	nomeDoador: string | null;
	quantidade: number;
	quantidadeDisponivel: number;
	observacao: string | null;
	validadeMaisProxima: string | null;
	criadoEm: string;
}

export interface Doador {
	id: number;
	nome: string;
	documento: string | null;
	telefone: string | null;
}

// ── Baixa de cesta (saída) ──────────────────────────────────────────────────────

// Entregas a famílias são registradas em "Entregas"; a baixa cobre só repasse/descarte/outro.
export type MotivoBaixaCesta = "Transferida" | "Descartada" | "Outro";

export const MOTIVOS_BAIXA_CESTA: { value: MotivoBaixaCesta; label: string }[] =
	[
		{ value: "Transferida", label: "Transferida (outra paróquia/órgão)" },
		{ value: "Descartada", label: "Descartada" },
		{ value: "Outro", label: "Outro" },
	];

export interface CestaBaixaBody {
	motivo: MotivoBaixaCesta;
	quantidade: number;
	observacao?: string | null;
}

// Status derivado do saldo (sem coluna persistida).
export function statusLote(l: LoteCesta): {
	label: string;
	className: string;
} {
	if (l.quantidadeDisponivel <= 0)
		return {
			label: "Esgotada",
			className: "bg-muted text-muted-foreground border-border",
		};
	if (l.quantidadeDisponivel < l.quantidade)
		return {
			label: "Parcial",
			className: "bg-warning/15 text-warning border-warning/30",
		};
	return {
		label: "Disponível",
		className: "bg-success/10 text-success border-success/25",
	};
}
