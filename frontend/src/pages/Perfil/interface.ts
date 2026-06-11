export interface Perfil {
	id: number;
	nome: string;
	descricao: string | null;
	estatico: boolean;
}

export interface PerfilCreateDto {
	nome: string;
	descricao?: string;
}

export interface PerfilUpdateDto {
	nome: string;
	descricao?: string;
}

export interface PerfilModalRef {
	open: (perfil?: Perfil) => void;
}

export interface PerfilModalProps {
	onSuccess: () => void;
}
