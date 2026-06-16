import type { ReactNode } from "react";

export interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (row: T) => ReactNode;
	align?: "left" | "right" | "center";
}

export interface PaginationState {
	page: number;
	pageSize: number;
	totalCount: number;
	onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	pagination: PaginationState;
	isLoading?: boolean;
	onEdit?: (item: T) => void;
	onView?: (item: T) => void;
	onDelete?: (item: T) => void;
	/** Mostra o botão de editar apenas quando retorna true (padrão: sempre). */
	canEdit?: (item: T) => boolean;
	/** Mostra o botão de excluir apenas quando retorna true (padrão: sempre). */
	canDelete?: (item: T) => boolean;
}
