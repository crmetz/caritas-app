import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CreatableComboboxProps } from "./interface";

export function CreatableCombobox({
	value,
	onChange,
	options,
	onCreate,
	placeholder = "Selecione...",
	disabled,
}: CreatableComboboxProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [creating, setCreating] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

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

	const selected = options.find((o) => o.value === value);
	const termo = search.trim();
	const filtered = options.filter((o) =>
		o.label.toLowerCase().includes(termo.toLowerCase()),
	);
	const exactMatch = options.some(
		(o) => o.label.toLowerCase() === termo.toLowerCase(),
	);

	const handleSelect = (id: number) => {
		onChange(id);
		setOpen(false);
		setSearch("");
	};

	const handleCreate = async () => {
		if (!termo || creating) return;
		setCreating(true);
		try {
			const nova = await onCreate(termo);
			onChange(nova.value);
			setOpen(false);
			setSearch("");
		} finally {
			setCreating(false);
		}
	};

	return (
		<div ref={containerRef} className="relative w-full">
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen((prev) => !prev)}
				className={cn(
					"flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm ring-offset-background",
					"focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					open && "border-primary ring-1 ring-ring",
				)}
			>
				<span className={cn(!selected && "text-muted-foreground")}>
					{selected ? selected.label : placeholder}
				</span>
				<ChevronDown
					className={cn(
						"ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg">
					<div className="border-b p-2">
						<input
							autoFocus
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar ou criar cidade..."
							className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>

					<div className="max-h-56 overflow-y-auto p-1">
						{filtered.map((o) => (
							<button
								key={o.value}
								type="button"
								onClick={() => handleSelect(o.value)}
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

						{termo && !exactMatch && (
							<button
								type="button"
								disabled={creating}
								onClick={handleCreate}
								className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary transition-colors hover:bg-accent disabled:opacity-50"
							>
								<Plus className="h-4 w-4" />
								{creating ? "Criando..." : `Criar "${termo}"`}
							</button>
						)}

						{filtered.length === 0 && !termo && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Nenhuma cidade cadastrada.
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
