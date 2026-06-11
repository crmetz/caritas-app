import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function formatCpf(value: string) {
	return onlyDigits(value)
		.slice(0, 11)
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCep(value: string) {
	return onlyDigits(value)
		.slice(0, 8)
		.replace(/(\d{5})(\d)/, "$1-$2");
}
