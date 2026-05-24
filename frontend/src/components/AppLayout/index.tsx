import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
	const linkClassName = ({ isActive }: { isActive: boolean }) =>
		cn(
			"rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
			isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
		);

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
				<div className="flex h-14 items-center gap-6 px-6">
					<span className="font-semibold text-lg">Caritas</span>
					<nav className="flex items-center gap-1">
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
				</div>
			</header>
			<main className="p-6">{children}</main>
		</div>
	);
}
