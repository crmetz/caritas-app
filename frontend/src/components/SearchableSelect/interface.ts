export interface SearchableSelectOption {
	value: number;
	label: string;
}

export interface SearchableSelectProps {
	value: number | null;
	onChange: (value: number | null) => void;
	options: SearchableSelectOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	/** Quando informado, exibe uma entrada no topo que limpa a seleção (value = null). */
	allOptionLabel?: string;
	disabled?: boolean;
	className?: string;
}
