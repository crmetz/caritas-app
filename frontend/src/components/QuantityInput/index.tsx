import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { QuantityInputProps } from "./interface";
import {
	formatMedida,
	parseCount,
	parseMedida,
	PLACEHOLDER_POR_FORMA,
	sugestoesMedida,
} from "./quantity";

// Componente único de entrada de quantidades. Toda lógica de parsing/normalização/validação vive em
// ./quantity — não reimplementar por tela.
export function QuantityInput(props: QuantityInputProps) {
	return props.mode === "medida" ? (
		<MedidaInput {...props} />
	) : (
		<CountInput {...props} />
	);
}

function MedidaInput({
	forma,
	value,
	onChange,
	id,
	disabled,
	placeholder,
	className,
	...rest
}: Extract<QuantityInputProps, { mode: "medida" }>) {
	const [text, setTextState] = useState(value ? formatMedida(value) : "");
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	// Espelha o texto atual para que o onBlur (em setTimeout) leia o valor mais recente — e não o
	// capturado no closure — evitando sobrescrever um clique em sugestão.
	const textRef = useRef(text);
	const setText = (v: string) => {
		textRef.current = v;
		setTextState(v);
	};

	// Sincroniza o texto quando o valor muda externamente e o campo não está em edição.
	useEffect(() => {
		if (!focused) setText(value ? formatMedida(value) : "");
	}, [value, focused]);

	const commit = (raw: string) => {
		const parsed = parseMedida(raw, forma);
		if (parsed) {
			onChange(parsed);
			setText(formatMedida(parsed)); // normaliza
		} else {
			onChange(null);
			setText(""); // entrada inválida → limpa por completo
		}
		setOpen(false);
	};

	const sugestoes = sugestoesMedida(text, forma);

	return (
		<div className={cn("relative", className)}>
			<Input
				id={id}
				disabled={disabled}
				placeholder={placeholder ?? PLACEHOLDER_POR_FORMA[forma]}
				value={text}
				onFocus={() => {
					setFocused(true);
					setOpen(true);
				}}
				onChange={(e) => {
					setText(e.target.value);
					setOpen(true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						commit(textRef.current);
						(e.target as HTMLInputElement).blur();
					} else if (e.key === "Escape") {
						setOpen(false);
					}
				}}
				onBlur={() => {
					// Atraso para permitir o clique em uma sugestão antes de validar/fechar.
					window.setTimeout(() => {
						setFocused(false);
						commit(textRef.current);
					}, 120);
				}}
				autoComplete="off"
				{...rest}
			/>

			{open && text.trim() !== "" && sugestoes.length > 0 && (
				<div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg">
					<div className="max-h-48 overflow-y-auto p-1">
						{sugestoes.map((s) => (
							<button
								key={s}
								type="button"
								// onMouseDown (não onClick) para disparar antes do onBlur do input.
								onMouseDown={(e) => {
									e.preventDefault();
									commit(s);
								}}
								className="flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								{s}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function CountInput({
	value,
	onChange,
	min = 1,
	max,
	id,
	disabled,
	placeholder,
	className,
	...rest
}: Extract<QuantityInputProps, { mode: "count" }>) {
	const [text, setText] = useState(value != null ? String(value) : "");
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setText(value != null ? String(value) : "");
	}, [value, focused]);

	const commit = (raw: string) => {
		const parsed = parseCount(raw, { min, max });
		if (parsed != null) {
			onChange(parsed);
			setText(String(parsed));
		} else {
			onChange(null);
			setText("");
		}
	};

	return (
		<Input
			id={id}
			type="number"
			inputMode="numeric"
			min={min}
			max={max}
			step="1"
			disabled={disabled}
			placeholder={placeholder}
			className={className}
			value={text}
			onFocus={() => setFocused(true)}
			onChange={(e) => setText(e.target.value)}
			onBlur={() => {
				setFocused(false);
				commit(text);
			}}
			{...rest}
		/>
	);
}
