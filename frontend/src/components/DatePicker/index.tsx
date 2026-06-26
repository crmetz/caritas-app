import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	// Valor em ISO 8601 (yyyy-mm-dd), como o back-end espera. "" / null = vazio.
	value: string | null;
	onChange: (iso: string) => void;
	id?: string;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	"aria-invalid"?: boolean;
	// Navegação por dropdown de mês/ano (útil para datas distantes, ex.: nascimento).
	captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
	startMonth?: Date;
	endMonth?: Date;
}

// Converte ISO (yyyy-mm-dd) em Date local sem deslocamento de fuso.
function isoToDate(iso: string | null): Date | undefined {
	if (!iso) return undefined;
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return undefined;
	return new Date(y, m - 1, d);
}

// Converte Date local em ISO (yyyy-mm-dd) sem usar toISOString (que aplica UTC).
function dateToIso(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// Componente único de seleção de data da aplicação. Entrada/saída sempre em ISO 8601.
export function DatePicker({
	value,
	onChange,
	id,
	disabled,
	placeholder = "Selecione a data",
	className,
	captionLayout,
	startMonth,
	endMonth,
	...rest
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const selected = isoToDate(value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					aria-invalid={rest["aria-invalid"]}
					className={cn(
						"h-12 w-full justify-start rounded-xl px-4 font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
					{selected
						? format(selected, "dd/MM/yyyy", { locale: ptBR })
						: placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0"
				align="start"
				data-testid="datepicker-content"
			>
				<Calendar
					mode="single"
					selected={selected}
					defaultMonth={selected}
					captionLayout={captionLayout}
					startMonth={startMonth}
					endMonth={endMonth}
					onSelect={(date) => {
						onChange(date ? dateToIso(date) : "");
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
