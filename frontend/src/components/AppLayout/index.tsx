import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import { Permissions } from "@/constants/permissions";

export function AppLayout() {
	const { session, paroquiaAtual, setParoquiaAtual, logout, hasPermission } = useSession();
	const navigate = useNavigate();

	const linkClassName = ({ isActive }: { isActive: boolean }) =>
		cn(
			"rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-card",
			isActive
				? "border-border bg-card text-foreground"
				: "border-transparent bg-transparent text-muted-foreground",
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
						<NavLink to="/familias" className={linkClassName}>
							Famílias
						</NavLink>
						<NavLink to="/atendimentos" className={linkClassName}>
							Atendimentos
						</NavLink>
						<NavLink to="/bazar" className={linkClassName}>
							Bazar
						</NavLink>
						<NavLink to="/brecho" className={linkClassName}>
							Brechó
						</NavLink>
						<NavLink to="/caixa" className={linkClassName}>
							Caixa
						</NavLink>
						{hasPermission(Permissions.Paroquia.Visualizar) && (
							<NavLink to="/paroquias" className={linkClassName}>
								Paróquias
							</NavLink>
						)}
						{hasPermission(Permissions.Usuario.Visualizar) && (
							<NavLink to="/usuarios" className={linkClassName}>
								Usuários
							</NavLink>
						)}
						{hasPermission(Permissions.Perfil.Visualizar) && (
							<NavLink to="/perfis" className={linkClassName}>
								Perfis
							</NavLink>
						)}
					</nav>
					<div className="ml-auto flex items-center gap-4">
						{session && session.paroquiasPermitidas.length > 0 && (
							<select
								id="paroquia-select"
								className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
								value={paroquiaAtual?.value ?? ""}
								onChange={(e) => {
									const selecionada = session.paroquiasPermitidas.find(
										(p) => String(p.value) === e.target.value,
									);
									if (selecionada) setParoquiaAtual(selecionada);
								}}
							>
								{session.paroquiasPermitidas.map((p) => (
									<option key={p.value} value={p.value}>
										{p.label}
									</option>
								))}
							</select>
						)}
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
