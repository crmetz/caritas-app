import type { ReactNode } from "react";

export interface RepeatableRowsProps<T> {
	rows: T[];
	onChange: (rows: T[]) => void;
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
