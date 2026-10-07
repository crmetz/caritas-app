import type * as React from "react";
import { DayPicker, type DropdownProps } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Dropdown de mês/ano com o Select do app no lugar do <select> nativo
// (https://daypicker.dev/guides/custom-components).
function CalendarDropdown({
	options,
	value,
	onChange,
	...props
}: DropdownProps) {
	const handleValueChange = (newValue: string) => {
		onChange?.({
			target: { value: newValue },
		} as React.ChangeEvent<HTMLSelectElement>);
	};

	return (
		<Select value={value?.toString()} onValueChange={handleValueChange}>
			<SelectTrigger
				aria-label={props["aria-label"]}
				className="h-8 w-auto gap-1 rounded-md px-2 font-medium capitalize"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="max-h-64">
				{options?.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value.toString()}
						disabled={option.disabled}
						className="capitalize"
					>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

// Estilo padrão do react-day-picker, com cores do tema aplicadas via variáveis --rdp-* em style.css.
function Calendar({ className, components, ...props }: CalendarProps) {
	return (
		<DayPicker
			locale={ptBR}
			className={cn("p-3", className)}
			components={{ Dropdown: CalendarDropdown, ...components }}
			{...props}
		/>
	);
}

export { Calendar };
