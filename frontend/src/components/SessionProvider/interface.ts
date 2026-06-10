export interface SelectObject {
	value: number;
	label: string;
}

export interface Session {
	id: number;
	nome: string;
	sobrenome: string;
	email: string;
	isAdmin: boolean;
	paroquiasPermitidas: SelectObject[];
}

export interface SessionContextValue {
	session: Session | null;
	loading: boolean;
	paroquiaAtual: SelectObject | null;
	setParoquiaAtual: (paroquia: SelectObject) => void;
	refreshSession: () => Promise<void>;
	logout: () => void;
}
