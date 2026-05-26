export interface Perfil {
	id: number;
	nome: string;
	descricao: string | null;
	perfilPaiId: number | null;
}

export interface Usuario {
	id: number;
	nome: string | null;
	sobrenome: string | null;
	email: string;
	cpf: string | null;
	telefone: string | null;
	dataNasc: string | null;
	perfilId: number | null;
	perfil?: Perfil | null;
	ativo: boolean;
	dataCriacao: string;
	dataInativacao: string | null;
}

export interface CreateUsuarioDto {
	nome: string;
	sobrenome: string;
	email: string;
	senha: string;
	cpf?: string;
	telefone?: string;
	dataNasc?: string;
	perfilId?: number | null;
}

export interface UsuarioUpdateDto {
	nome?: string;
	sobrenome?: string;
	telefone?: string;
	dataNasc?: string;
	perfilId?: number | null;
}

export interface UsuarioModalRef {
	open: (usuario?: Usuario) => void;
}

export interface UsuarioModalProps {
	onSuccess: () => void;
}

export function usuarioNomeCompleto(usuario: Usuario) {
	return [usuario.nome, usuario.sobrenome].filter(Boolean).join(" ") || "-";
}
