import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppLayout() {
	const linkClassName = ({ isActive }: { isActive: boolean }) =>
		cn(
			"rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-card",
			isActive ? "border-border bg-card text-foreground" : "border-transparent bg-transparent text-muted-foreground",
		);

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
				</div>
			</header>
			<main className="mx-auto w-full max-w-7xl p-6">
				<Outlet />
			</main>
		</div>
	);
}
