export interface Perfil {
	id: number;
	nome: string;
	descricao: string | null;
	estatico: boolean;
	permissions: string[];
}

export interface PerfilCreateDto {
	nome: string;
	descricao?: string;
	permissions: string[];
}

export interface PerfilUpdateDto {
	nome: string;
	descricao?: string;
	permissions: string[];
}

export interface PermissionItem {
	value: string;
	label: string;
}

export interface PermissionModule {
	module: string;
	permissions: PermissionItem[];
}

export interface PerfilModalRef {
	open: (perfil?: Perfil) => void;
}

export interface PerfilModalProps {
	onSuccess: () => void;
}
