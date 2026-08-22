import type { LucideIcon } from "lucide-react";

export interface NavItem {
	label: string;
	to: string;
	icon: LucideIcon;
	permission: string;
}

export interface NavGroup {
	label: string;
	icon: LucideIcon;
	/** Um único item visível é renderizado como link direto, sem menu suspenso. */
	items: NavItem[];
}
