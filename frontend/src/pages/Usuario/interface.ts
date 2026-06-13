export interface Perfil {
	id: number;
	nome: string;
	descricao: string | null;
	perfilPaiId: number | null;
}

export interface Usuario {
	id: number;
	nome: string;
	sobrenome: string;
	email: string;
	cpf: string | null;
	telefone: string | null;
	dataNasc: string | null;
	perfilId: number | null;
	perfil?: { value: number; label: string } | null;
	ativo: boolean;
	paroquiasPermitidas: Array<{ value: number; label: string }>;
	criadoEm: string;
	autalizadoEm: string | null;
}

export interface UsuarioResponseDto {
	id: number;
	nome: string;
	email: string;
	sobrenome: string;
	telefone: string | null;
	ativo: boolean;
	criadoEm: string;
}

export interface CreateUsuarioDto {
	nome: string;
	sobrenome: string;
	email: string;
	cpf: string | undefined;
	telefone: string | undefined;
	dataNasc: string | undefined;
	paroquiasPermitidas: number[];
	perfilId?: number | null;
}

export interface UpdateUsuarioDto extends Omit<CreateUsuarioDto, "email"> {};

export interface UsuarioModalRef {
	open: (id?: number) => void;
}

export interface UsuarioModalProps {
	onSuccess: () => void;
}

export function usuarioNomeCompleto(usuario: Usuario | UsuarioResponseDto) {
	return [usuario.nome, usuario.sobrenome].filter(Boolean).join(" ") || "-";
}
