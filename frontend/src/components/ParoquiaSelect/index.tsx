import { MultiSelect, type SelectOption } from "@/components/ui/MultiSelect";

export interface ParoquiaSelectOption extends SelectOption<number> {
	raiz?: boolean;
}

interface ParoquiaSelectProps {
	value: number[];
	onChange: (values: number[]) => void;
	options?: ParoquiaSelectOption[];
	fetchOptions?: () => Promise<ParoquiaSelectOption[]>;
	placeholder?: string;
	disabled?: boolean;
}

/**
 * MultiSelect especializado para paróquias.
 * Exibe um indicador visual distinto para a diocese (raiz = true).
 */
export function ParoquiaSelect(props: ParoquiaSelectProps) {
	return (
		<MultiSelect<number>
			{...props}
			searchable
			searchPlaceholder="Buscar paróquia..."
			renderOption={(option) => {
				const o = option as ParoquiaSelectOption;
				return (
					<span className="flex items-center justify-between w-full gap-2">
						<span>{o.label}</span>
						{o.raiz && (
							<span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
								Diocese
							</span>
						)}
					</span>
				);
			}}
			renderBadge={(option) => {
				const o = option as ParoquiaSelectOption;
				return (
					<span className="flex items-center gap-1">
						{o.raiz && (
							<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
						)}
						{o.label}
					</span>
				);
			}}
		/>
	);
}
