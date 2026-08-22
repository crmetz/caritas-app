import {
	BookUser,
	Boxes,
	ChevronDown,
	Church,
	CircleUser,
	ClipboardList,
	HandHeart,
	LogOut,
	Menu,
	Package,
	ShieldCheck,
	Shirt,
	ShoppingBasket,
	Store,
	Truck,
	UserCog,
	Users,
	Wallet,
} from "lucide-react";
import { Fragment } from "react";
import {
	Link,
	NavLink,
	Outlet,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { useSession } from "@/components/SessionProvider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Permissions } from "@/constants/permissions";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "./interface";

// Navegação declarada em grupos. Com os doze módulos como links soltos, o header
// somava ~1900px e estourava o próprio container (max-w-7xl), o que colocava
// rolagem horizontal na página inteira em qualquer resolução.
const NAV_GROUPS: NavGroup[] = [
	{
		label: "Famílias",
		icon: Users,
		items: [
			{
				label: "Famílias",
				to: "/familias",
				icon: Users,
				permission: Permissions.Familia.Visualizar,
			},
		],
	},
	{
		label: "Atendimentos",
		icon: ClipboardList,
		items: [
			{
				label: "Atendimentos",
				to: "/atendimentos",
				icon: ClipboardList,
				permission: Permissions.Atendimento.Visualizar,
			},
		],
	},
	{
		label: "Vendas",
		icon: Store,
		items: [
			{
				label: "Bazar",
				to: "/bazar",
				icon: Store,
				permission: Permissions.Bazar.Visualizar,
			},
			{
				label: "Brechó",
				to: "/brecho",
				icon: Shirt,
				permission: Permissions.Brecho.Visualizar,
			},
			{
				label: "Caixa",
				to: "/caixa",
				icon: Wallet,
				permission: Permissions.Caixa.Visualizar,
			},
		],
	},
	{
		label: "Doações e Entregas",
		icon: Package,
		items: [
			{
				label: "Estoque",
				to: "/estoque",
				icon: Boxes,
				permission: Permissions.Suprimentos.Visualizar,
			},
			{
				label: "Cestas",
				to: "/cesta-basica",
				icon: ShoppingBasket,
				permission: Permissions.Suprimentos.Visualizar,
			},
			{
				label: "Doações",
				to: "/doacoes",
				icon: HandHeart,
				permission: Permissions.Suprimentos.Visualizar,
			},
			{
				label: "Entregas",
				to: "/entregas",
				icon: Truck,
				permission: Permissions.Suprimentos.Visualizar,
			},
		],
	},
	{
		label: "Cadastros",
		icon: BookUser,
		items: [
			{
				label: "Paróquias",
				to: "/paroquias",
				icon: Church,
				permission: Permissions.Paroquia.Visualizar,
			},
			{
				label: "Usuários",
				to: "/usuarios",
				icon: UserCog,
				permission: Permissions.Usuario.Visualizar,
			},
			{
				label: "Perfis",
				to: "/perfis",
				icon: ShieldCheck,
				permission: Permissions.Perfil.Visualizar,
			},
		],
	},
];

const navTriggerClassName =
	"flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function navStateClassName(isActive: boolean) {
	return isActive
		? "border-border bg-card text-foreground"
		: "border-transparent bg-transparent text-muted-foreground";
}

export function AppLayout() {
	const { session, paroquiaAtual, setParoquiaAtual, logout, hasPermission } =
		useSession();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	// A barra no startsWith evita que /estoque case com /estoque-alimentos, e cobre
	// as sub-rotas das páginas (/bazar/relatorio, /brecho/historico, ...).
	function isItemActive(item: NavItem) {
		return pathname === item.to || pathname.startsWith(`${item.to}/`);
	}

	const grupos = NAV_GROUPS.map((group) => ({
		...group,
		items: group.items.filter((item) => hasPermission(item.permission)),
	})).filter((group) => group.items.length > 0);

	function handleLogout() {
		logout();
		navigate("/login", { replace: true });
	}

	function renderMenuItem(item: NavItem) {
		const ItemIcon = item.icon;
		return (
			<DropdownMenuItem key={item.to} asChild>
				<Link
					to={item.to}
					className={cn(
						"cursor-pointer",
						isItemActive(item) && "bg-accent text-accent-foreground",
					)}
				>
					<ItemIcon className="h-4 w-4" />
					{item.label}
				</Link>
			</DropdownMenuItem>
		);
	}

	const nomeCompleto = session ? `${session.nome} ${session.sobrenome}` : "";

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-background/90">
				<div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
					<span className="shrink-0 font-semibold text-lg">Caritas</span>

					<nav className="hidden min-w-0 items-center gap-2 lg:flex">
						{grupos.map((group) => {
							const unico = group.items.length === 1 ? group.items[0] : null;

							if (unico) {
								const ItemIcon = unico.icon;
								return (
									<NavLink
										key={group.label}
										to={unico.to}
										className={({ isActive }) =>
											cn(navTriggerClassName, navStateClassName(isActive))
										}
									>
										<ItemIcon className="h-4 w-4" />
										{unico.label}
									</NavLink>
								);
							}

							const GroupIcon = group.icon;
							const grupoAtivo = group.items.some(isItemActive);

							return (
								<DropdownMenu key={group.label}>
									<DropdownMenuTrigger
										className={cn(
											navTriggerClassName,
											navStateClassName(grupoAtivo),
										)}
									>
										<GroupIcon className="h-4 w-4" />
										{group.label}
										<ChevronDown className="h-4 w-4 opacity-60" />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="min-w-48">
										{group.items.map(renderMenuItem)}
									</DropdownMenuContent>
								</DropdownMenu>
							);
						})}
					</nav>

					<div className="lg:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger
								aria-label="Abrir menu de navegação"
								className={cn(navTriggerClassName, navStateClassName(false))}
							>
								<Menu className="h-4 w-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="min-w-56">
								{grupos.map((group, index) => (
									<Fragment key={group.label}>
										{index > 0 && <DropdownMenuSeparator />}
										{group.items.length > 1 && (
											<DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wide">
												{group.label}
											</DropdownMenuLabel>
										)}
										{group.items.map(renderMenuItem)}
									</Fragment>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="ml-auto flex shrink-0 items-center gap-3">
						{session && session.paroquiasPermitidas.length > 0 && (
							<select
								aria-label="Paróquia atual"
								className="max-w-[200px] truncate rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
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
							<DropdownMenu>
								<DropdownMenuTrigger
									aria-label="Menu da conta"
									className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<CircleUser className="h-5 w-5" />
									<span className="hidden max-w-[140px] truncate sm:inline">
										{nomeCompleto}
									</span>
									<ChevronDown className="h-4 w-4 opacity-60" />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="min-w-48">
									<DropdownMenuLabel className="truncate">
										{nomeCompleto}
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onSelect={handleLogout}
										className="cursor-pointer text-destructive focus:text-destructive"
									>
										<LogOut className="h-4 w-4" />
										Sair
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-7xl p-6">
				<Outlet />
			</main>
		</div>
	);
}
