export type SituacaoMoradia =
	| "Propria"
	| "Alugada"
	| "Cedida"
	| "Irregular"
	| "Abrigo";

export type Vulnerabilidade =
	| "Desemprego"
	| "InsegurancaAlimentar"
	| "ViolenciaDomestica"
	| "MoradiaPrecaria"
	| "Deficiencia"
	| "DependenciaQuimica";

export interface Pessoa {
	id: number;
	nome: string;
	cpf: string | null;
	identificacaoAlternativa: string | null;
	dataNascimento: string;
	telefone: string | null;
	escolaridade: string | null;
	profissao: string | null;
	possuiDeficiencia: boolean;
	observacoes: string | null;
	familiaId: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface Familia {
	id: number;
	responsavelId: number;
	responsavel: Pessoa | null;
	membros: Pessoa[];
	rendaFamiliar: number;
	situacaoMoradia: SituacaoMoradia;
	vulnerabilidade: number;
	observacoes: string | null;
	rua: string;
	numero: string;
	complemento: string | null;
	bairro: string;
	cidade: string;
	estado: string;
	cep: string;
	createdAt: string;
	updatedAt: string;
}

export interface PessoaCreateDto {
	nome: string;
	cpf?: string;
	identificacaoAlternativa?: string;
	dataNascimento: string;
	telefone?: string;
	escolaridade?: string;
	profissao?: string;
	possuiDeficiencia: boolean;
	observacoes?: string;
}

export interface FamiliaCreateDto {
	responsavel: PessoaCreateDto;
	rendaFamiliar: number;
	situacaoMoradia: SituacaoMoradia;
	vulnerabilidade: number;
	observacoes?: string;
	rua: string;
	numero: string;
	complemento?: string;
	bairro: string;
	cidade: string;
	estado: string;
	cep: string;
}

export interface FamiliaUpdateDto {
	responsavelId: number;
	rendaFamiliar: number;
	situacaoMoradia: SituacaoMoradia;
	vulnerabilidade: number;
	observacoes?: string;
	rua: string;
	numero: string;
	complemento?: string;
	bairro: string;
	cidade: string;
	estado: string;
	cep: string;
}

export const SITUACAO_MORADIA_LABELS: Record<SituacaoMoradia, string> = {
	Propria: "Própria",
	Alugada: "Alugada",
	Cedida: "Cedida",
	Irregular: "Irregular",
	Abrigo: "Abrigo",
};

export const VULNERABILIDADE_FLAGS: { value: number; label: string }[] = [
	{ value: 1, label: "Desemprego" },
	{ value: 2, label: "Insegurança Alimentar" },
	{ value: 4, label: "Violência Doméstica" },
	{ value: 8, label: "Moradia Precária" },
	{ value: 16, label: "Deficiência" },
	{ value: 32, label: "Dependência Química" },
];

export function vulnerabilidadeToLabels(flags: number): string[] {
	return VULNERABILIDADE_FLAGS.filter((v) => (flags & v.value) !== 0).map(
		(v) => v.label,
	);
}

export interface FamiliaModalRef {
	open: (familia?: Familia) => void;
}

export interface FamiliaModalProps {
	onSuccess: () => void;
}
