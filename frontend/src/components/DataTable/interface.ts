import type { ReactNode } from "react";

export interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (row: T) => ReactNode;
	align?: "left" | "right" | "center";
	/** Quando definido, o header vira ordenável (server-side) usando esta chave. */
	sortKey?: string;
}

export interface PaginationState {
	page: number;
	pageSize: number;
	totalCount: number;
	onPageChange: (page: number) => void;
}

/** Ordenação server-side: a página controla a chave/direção e refaz a busca. */
export interface SortState {
	sortKey?: string | null;
	sortDir?: "asc" | "desc";
	onSort: (key: string) => void;
}

export interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	pagination: PaginationState;
	sort?: SortState;
	isLoading?: boolean;
	onEdit?: (item: T) => void;
	onView?: (item: T) => void;
	onDelete?: (item: T) => void;
	/** Mostra o botão de editar apenas quando retorna true (padrão: sempre). */
	canEdit?: (item: T) => boolean;
	/** Mostra o botão de excluir apenas quando retorna true (padrão: sempre). */
	canDelete?: (item: T) => boolean;
	/** Classe extra por linha (ex.: destacar itens vencidos). */
	rowClassName?: (item: T) => string;
}
