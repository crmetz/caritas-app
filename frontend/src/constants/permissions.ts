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
} as const;
