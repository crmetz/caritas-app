import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface RepeatableRowsProps<T> {
	rows: T[];
	// Aceita updater funcional (setState) — essencial para não sobrescrever o array
	// com um snapshot obsoleto vindo de callbacks atrasados (ex.: commit do QuantityInput).
	onChange: Dispatch<SetStateAction<T[]>>;
	// Cria uma nova linha vazia.
	newRow: () => T;
	// Mínimo de dados obrigatórios preenchidos para a linha ser considerada completa.
	// Usado para liberar o botão "adicionar" e impedir linhas vazias em sequência.
	isRowComplete: (row: T) => boolean;
	// Renderiza o conteúdo de uma linha. `update` mescla um patch na linha.
	renderRow: (
		row: T,
		index: number,
		update: (patch: Partial<T>) => void,
	) => ReactNode;
	addLabel?: string;
	// Quantidade mínima de linhas que sempre permanece (não removível). Padrão: 1.
	minRows?: number;
	className?: string;
}
