import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SearchableSelectProps } from "./interface";

// Combobox com busca. Segue o mesmo modelo do MultiSelect (padrão da app): a lista é renderizada
// in-flow (absoluta dentro do próprio container, sem portal), então fica dentro do conteúdo do
// Dialog e (1) volta a rolar com a roda do mouse — o react-remove-scroll só bloqueia a roda fora do
// conteúdo do modal — e (2) arrastar a barra de scroll não fecha a lista, pois o handler de clique
// externo ignora cliques na scrollbar. O gatilho é um <input> que também serve de busca inline.
export function SearchableSelect({
	value,
	onChange,
	options,
	placeholder = "Selecione...",
	emptyMessage = "Nenhum resultado encontrado.",
	allOptionLabel,
	disabled,
	className,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);
	const [openUp, setOpenUp] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const selected = options.find((o) => o.value === value);
	const termo = search.trim().toLowerCase();
	const filtered = options.filter((o) => o.label.toLowerCase().includes(termo));

	const close = () => {
		setOpen(false);
		setSearch("");
	};

	const handleSelect = (id: number | null) => {
		onChange(id);
		close();
		inputRef.current?.blur();
	};

	// Abre para cima quando não há espaço suficiente abaixo (ex.: linha perto do fim do modal).
	useLayoutEffect(() => {
		if (!open) return;
		const r = containerRef.current?.getBoundingClientRect();
		if (!r) return;
		const espacoAbaixo = window.innerHeight - r.bottom;
		setOpenUp(espacoAbaixo < 280 && r.top > espacoAbaixo);
	}, [open]);

	// Fecha ao clicar fora — ignorando cliques na scrollbar de qualquer container rolável (do modal
	// ou da própria lista), cujo mousedown tem alvo fora do select e fecharia a lista sem querer.
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (target) {
				const naScrollbarVertical =
					target.scrollHeight > target.clientHeight &&
					e.offsetX > target.clientWidth;
				const naScrollbarHorizontal =
					target.scrollWidth > target.clientWidth &&
					e.offsetY > target.clientHeight;
				if (naScrollbarVertical || naScrollbarHorizontal) return;
			}
			if (containerRef.current && !containerRef.current.contains(target))
				close();
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={containerRef} className={cn("relative min-w-0", className)}>
			<input
				ref={inputRef}
				type="text"
				disabled={disabled}
				value={open ? search : (selected?.label ?? "")}
				placeholder={allOptionLabel ?? placeholder}
				// Abre ao clicar/digitar — não ao receber foco, senão o auto-focus do Dialog (no
				// primeiro campo, ao abrir o modal) abriria a lista por cima do conteúdo.
				onClick={() => setOpen(true)}
				onChange={(e) => {
					setSearch(e.target.value);
					setOpen(true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						close();
						(e.target as HTMLInputElement).blur();
					}
				}}
				className={cn(
					"flex h-12 w-full min-w-0 truncate rounded-xl border border-input bg-background py-2 pl-4 pr-10 text-sm shadow-sm ring-offset-background",
					"placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					open && "border-primary ring-1 ring-ring",
				)}
			/>
			<ChevronDown
				className={cn(
					"pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-transform",
					open && "rotate-180",
				)}
			/>

			{open && (
				<div
					className={cn(
						"absolute left-0 right-0 z-50 rounded-xl border bg-popover shadow-lg",
						openUp ? "bottom-full mb-1" : "top-full mt-1",
					)}
				>
					<div className="max-h-56 overflow-y-auto p-1">
						{allOptionLabel && (
							<button
								type="button"
								// onMouseDown + preventDefault: seleciona sem tirar o foco do input.
								onMouseDown={(e) => {
									e.preventDefault();
									handleSelect(null);
								}}
								className={cn(
									"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
									"hover:bg-accent hover:text-accent-foreground",
									value === null && "bg-accent/50",
								)}
							>
								<span className="flex h-4 w-4 shrink-0 items-center justify-center">
									{value === null && <Check className="h-3 w-3" />}
								</span>
								<span className="truncate">{allOptionLabel}</span>
							</button>
						)}

						{filtered.map((o) => (
							<button
								key={o.value}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									handleSelect(o.value);
								}}
								className={cn(
									"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
									"hover:bg-accent hover:text-accent-foreground",
									o.value === value && "bg-accent/50",
								)}
							>
								<span className="flex h-4 w-4 shrink-0 items-center justify-center">
									{o.value === value && <Check className="h-3 w-3" />}
								</span>
								<span className="truncate">{o.label}</span>
							</button>
						))}

						{filtered.length === 0 && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								{emptyMessage}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
