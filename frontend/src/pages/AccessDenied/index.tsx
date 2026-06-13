export default function AccessDeniedPage() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
			<h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
			<p className="text-sm text-muted-foreground">
				Você não tem permissão para acessar esta página.
			</p>
		</div>
	);
}
