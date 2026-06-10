import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, Church, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import type { SelectObject } from "@/components/SessionProvider/interface";

function ContextoIcon({ item, className }: { item: SelectObject; className?: string }) {
	if (item.raiz) return <Landmark className={cn("h-3.5 w-3.5", className)} />;
	return <Church className={cn("h-3.5 w-3.5", className)} />;
}

function ContextoSwitcher() {
	const { session, paroquiaAtual, setParoquiaAtual } = useSession();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	if (!session || session.paroquiasPermitidas.length === 0) return null;

	const opcoes = session.paroquiasPermitidas;

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
					paroquiaAtual?.raiz ? "text-red-600" : "text-foreground",
				)}
			>
				{paroquiaAtual && (
					<ContextoIcon
						item={paroquiaAtual}
						className={paroquiaAtual.raiz ? "text-red-600" : "text-muted-foreground"}
					/>
				)}
				<span>{paroquiaAtual?.label ?? "Selecionar"}</span>
				<ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-xl border bg-popover shadow-lg">
					<div className="p-1">
						{opcoes.map((opcao, i) => {
							const isSelected = paroquiaAtual?.value === opcao.value;
							const isDiocese = opcao.raiz;

							return (
								<div key={opcao.value}>
									{/* separador visual entre diocese e paróquias */}
									{i > 0 && opcoes[i - 1].raiz && !isDiocese && (
										<div className="my-1 border-t border-border" />
									)}
									<button
										type="button"
										onClick={() => { setParoquiaAtual(opcao); setOpen(false); }}
										className={cn(
											"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
											"hover:bg-accent",
											isSelected && "bg-accent/50",
											isDiocese ? "text-red-600" : "text-foreground",
										)}
									>
										<ContextoIcon
											item={opcao}
											className={isDiocese ? "text-red-600" : "text-muted-foreground"}
										/>
										<span className={isDiocese ? "font-medium" : ""}>{opcao.label}</span>
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

export function AppLayout() {
	const { session, logout } = useSession();
	const navigate = useNavigate();

	const linkClassName = ({ isActive }: { isActive: boolean }) =>
		cn(
			"rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-card",
			isActive ? "border-border bg-card text-foreground" : "border-transparent bg-transparent text-muted-foreground",
		);

	function handleLogout() {
		logout();
		navigate("/login", { replace: true });
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-background/90">
				<div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
					<span className="font-semibold text-lg">Caritas</span>
					<nav className="flex items-center gap-2">
						<NavLink to="/" className={linkClassName}>
							Famílias
						</NavLink>
						<NavLink to="/paroquias" className={linkClassName}>
							Paróquias
						</NavLink>
						<NavLink to="/usuarios" className={linkClassName}>
							Usuários
						</NavLink>
					</nav>
					<div className="ml-auto flex items-center gap-4">
						<ContextoSwitcher />
						{session && (
							<span className="text-sm font-medium text-muted-foreground">
								{session.nome} {session.sobrenome}
							</span>
						)}
						<button
							type="button"
							onClick={handleLogout}
							className="rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
						>
							Sair
						</button>
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-7xl p-6">
				<Outlet />
			</main>
		</div>
	);
}
