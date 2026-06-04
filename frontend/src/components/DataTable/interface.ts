import type { ReactNode } from "react";

export interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (row: T) => ReactNode;
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
	onDelete?: (item: T) => void;
}
