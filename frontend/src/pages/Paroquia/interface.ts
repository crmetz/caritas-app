export interface Endereco {
	id: number;
	rua: string | null;
	numero: string | null;
	cep: string | null;
	bairro: string | null;
	cidade: string | null;
}

export interface Paroquia {
	id: number;
	nome: string;
	raiz: boolean;
	ativa: boolean;
	enderecoId: number | null;
	endereco: Endereco | null;
}

export interface EnderecoDto {
	rua?: string;
	numero?: string;
	cep?: string;
	bairro?: string;
	cidade?: string;
}

export interface ParoquiaCreateDto {
	nome: string;
	endereco: EnderecoDto;
}

export interface ParoquiaUpdateDto {
	nome: string;
	enderecoId?: number | null;
	endereco: EnderecoDto;
}

export interface ParoquiaModalRef {
	open: (paroquia?: Paroquia) => void;
}

export interface ParoquiaModalProps {
	onSuccess: () => void;
}
