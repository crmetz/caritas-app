// Constantes de permissões — espelham os valores definidos no backend

export const Permissions = {
	Usuario: {
		Visualizar: "usuario.visualizar",
		CriarEditar: "usuario.criarEditar",
	},
	Paroquia: {
		Visualizar: "paroquia.visualizar",
		CriarEditar: "paroquia.criarEditar",
	},
	Perfil: {
		Visualizar: "perfil.visualizar",
		CriarEditar: "perfil.criarEditar",
	},
	Atendimento: {
		Visualizar: "atendimento.visualizar",
		CriarEditar: "atendimento.criarEditar",
		VisualizarEvolucao: "atendimento.visualizarEvolucao",
	},
	Familia: {
		Visualizar: "familia.visualizar",
		CriarEditar: "familia.criarEditar",
	},
	Bazar: {
		Visualizar: "bazar.visualizar",
		RegistrarVenda: "bazar.registrarVenda",
		Relatorio: "bazar.relatorio",
	},
	Brecho: {
		Visualizar: "brecho.visualizar",
		RegistrarVenda: "brecho.registrarVenda",
		Historico: "brecho.historico",
	},
	Caixa: {
		Visualizar: "caixa.visualizar",
		Lancar: "caixa.lancar",
		Relatorio: "caixa.relatorio",
	},
	Suprimentos: {
		Visualizar: "suprimentos.visualizar",
		CriarEditar: "suprimentos.criarEditar",
	},
} as const;
