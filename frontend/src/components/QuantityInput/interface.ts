import type { FormaMedida, Medida } from "./quantity";

interface CommonProps {
	id?: string;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	"aria-invalid"?: boolean;
}

// Modo "medida": entrada com unidade (peso/volume/unidade) — autocomplete + normalização no blur.
export interface MedidaProps extends CommonProps {
	mode: "medida";
	forma: FormaMedida;
	value: Medida | null;
	onChange: (value: Medida | null) => void;
}

// Modo "count": contador inteiro positivo (pacotes, cestas, qtd a dar baixa).
export interface CountProps extends CommonProps {
	mode: "count";
	value: number | null;
	onChange: (value: number | null) => void;
	min?: number;
	max?: number;
}

export type QuantityInputProps = MedidaProps | CountProps;
