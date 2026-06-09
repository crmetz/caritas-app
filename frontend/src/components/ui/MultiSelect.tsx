import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SelectValue = string | number | boolean;

export interface SelectOption<T = number> {
	value: T;
	label: string;
}

interface MultiSelectProps<T = number> {
	value: T[];
	onChange: (values: T[]) => void;
	options?: SelectOption<T>[];
	fetchOptions?: () => Promise<SelectOption<T>[]>;
	placeholder?: string;
	disabled?: boolean;
}

export function MultiSelect<T extends SelectValue = string>({
	value,
	onChange,
	options: optionsProp,
	fetchOptions,
	placeholder = "Selecione...",
	disabled,
}: MultiSelectProps<T>) {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<SelectOption<T>[]>(optionsProp ?? []);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (optionsProp) setOptions(optionsProp);
	}, [optionsProp]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handler);

		return () => document.removeEventListener("mousedown", handler);
	}, []);

	useEffect(() => {
		if (!open || !fetchOptions || options.length > 0) return;

		setLoading(true);

		fetchOptions()
			.then(setOptions)
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [open, fetchOptions, options.length]);

	const toggle = (val: T) => {
		onChange(
			value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
		);
	};

	const remove = (val: T, e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(value.filter((v) => v !== val));
	};

	const selectedOptions = options.filter((o) => value.includes(o.value));

	return (
		<div ref={containerRef} className="relative w-full">
			<div
				onClick={() => setOpen((prev) => !prev)}
				className={cn(
					"flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background",
					"focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					open && "border-primary ring-1 ring-ring",
				)}
			>
				{selectedOptions.length === 0 ? (
					<span className="text-muted-foreground">{placeholder}</span>
				) : (
					selectedOptions.map((o) => (
						<Badge
							key={String(o.value)}
							variant="secondary"
							className="flex items-center gap-1 pr-1 text-xs"
						>
							{o.label}

							<button
								type="button"
								onClick={(e) => remove(o.value, e)}
								className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))
				)}

				<ChevronDown
					className={cn(
						"ml-auto h-4 w-4 shrink-0 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</div>

			{open && (
				<div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg">
					<div className="max-h-56 overflow-y-auto p-1">
						{loading && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Carregando...
							</p>
						)}

						{!loading && options.length === 0 && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Nenhum item disponível.
							</p>
						)}

						{!loading &&
							options.map((o) => {
								const selected = value.includes(o.value);

								return (
									<button
										key={String(o.value)}
										type="button"
										onClick={() => toggle(o.value)}
										className={cn(
											"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
											"hover:bg-accent hover:text-accent-foreground",
											selected && "bg-accent/50",
										)}
									>
										<span
											className={cn(
												"flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input",
												selected &&
													"border-primary bg-primary text-primary-foreground",
											)}
										>
											{selected && <Check className="h-3 w-3" />}
										</span>

										{o.label}
									</button>
								);
							})}
					</div>

					{value.length > 0 && (
						<div className="border-t p-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 w-full text-xs text-muted-foreground"
								onClick={() => onChange([])}
							>
								Limpar seleção ({value.length})
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
