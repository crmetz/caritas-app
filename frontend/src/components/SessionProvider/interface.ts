export interface SelectObject {
	value: number;
	label: string;
	raiz?: boolean;
}

export interface Session {
	id: number;
	nome: string;
	sobrenome: string;
	email: string;
	isAdmin: boolean;
	permissions: string[];
	paroquiasPermitidas: SelectObject[];
}

export interface SessionContextValue {
	session: Session | null;
	loading: boolean;
	paroquiaAtual: SelectObject | null;
	setParoquiaAtual: (paroquia: SelectObject) => void;
	refreshSession: () => Promise<void>;
	logout: () => void;
	hasPermission: (permission: string) => boolean;
	checkPermission: (permission: string) => boolean;
}
