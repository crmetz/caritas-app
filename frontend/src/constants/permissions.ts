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
} as const;
