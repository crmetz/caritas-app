export interface ComboboxOption {
	value: number;
	label: string;
}

export interface CreatableComboboxProps {
	value: number | null;
	onChange: (value: number | null) => void;
	options: ComboboxOption[];
	onCreate: (nome: string) => Promise<ComboboxOption>;
	placeholder?: string;
	disabled?: boolean;
}
