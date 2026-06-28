import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { SearchableSelectProps } from "./interface";

interface ListaPos {
	left: number;
	width: number;
	top?: number;
	bottom?: number;
}

// Combobox com busca. O gatilho é um <input> (fica dentro do modal, então mantém o foco sem disputa
// com o focus-trap do Dialog). A lista de opções é portalizada para o body (posição fixed) para
// sobrepor e exceder o modal sem recortes — sem role="dialog" (não colide com o modal) e sem
// elementos focáveis (selecionadas via onMouseDown, mantendo o foco no input).
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
	const [search, setSearch] = useState("");
	const [pos, setPos] = useState<ListaPos | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

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

	// Fecha ao clicar fora do gatilho e da lista (a lista vive num portal, fora do container).
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			const t = e.target as Node;
			if (containerRef.current?.contains(t)) return;
			if (listRef.current?.contains(t)) return;
			close();
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	// Posiciona a lista (fixed) ancorada ao gatilho, acompanhando scroll/resize.
	useLayoutEffect(() => {
		if (!open) {
			setPos(null);
			return;
		}
		const atualizar = () => {
			const r = containerRef.current?.getBoundingClientRect();
			if (!r) return;
			const espacoAbaixo = window.innerHeight - r.bottom;
			const altoEstimado = 300;
			const abrirAcima = espacoAbaixo < altoEstimado && r.top > espacoAbaixo;
			setPos({
				left: r.left,
				width: r.width,
				...(abrirAcima
					? { bottom: window.innerHeight - r.top + 4 }
					: { top: r.bottom + 4 }),
			});
		};
		atualizar();
		window.addEventListener("scroll", atualizar, true);
		window.addEventListener("resize", atualizar);
		return () => {
			window.removeEventListener("scroll", atualizar, true);
			window.removeEventListener("resize", atualizar);
		};
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

			{open &&
				pos &&
				createPortal(
					<div
						ref={listRef}
						style={{
							position: "fixed",
							left: pos.left,
							width: pos.width,
							top: pos.top,
							bottom: pos.bottom,
						}}
						// pointer-events-auto: o Dialog modal põe pointer-events:none no body.
						className="pointer-events-auto z-[60] rounded-xl border bg-popover shadow-lg"
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
										"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
										"hover:bg-accent hover:text-accent-foreground",
										value === null && "bg-accent/50",
									)}
								>
									<span className="flex h-4 w-4 shrink-0 items-center justify-center">
										{value === null && <Check className="h-3 w-3" />}
									</span>
									{allOptionLabel}
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
										"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
										"hover:bg-accent hover:text-accent-foreground",
										o.value === value && "bg-accent/50",
									)}
								>
									<span className="flex h-4 w-4 shrink-0 items-center justify-center">
										{o.value === value && <Check className="h-3 w-3" />}
									</span>
									{o.label}
								</button>
							))}

							{filtered.length === 0 && (
								<p className="py-4 text-center text-sm text-muted-foreground">
									{emptyMessage}
								</p>
							)}
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
