import type { DestinoSaida, OrigemEntrada } from "../Caixa/interface";

export type { DestinoSaida, OrigemEntrada };

export interface EntradaPorOrigem {
	origem: OrigemEntrada;
	total: number;
}

export interface SaidaPorDestino {
	destino: DestinoSaida;
	total: number;
}

export interface FamiliaBeneficiada {
	familia: string;
	total: number;
}

export interface RelatorioCaixa {
	totalEntradas: number;
	totalSaidas: number;
	saldo: number;
	entradasPorOrigem: EntradaPorOrigem[];
	saidasPorDestino: SaidaPorDestino[];
	familiasBeneficiadas: FamiliaBeneficiada[];
}
