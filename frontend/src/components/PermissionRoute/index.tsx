import { Outlet } from "react-router-dom";
import { useSession } from "@/components/SessionProvider";
import AccessDeniedPage from "@/pages/AccessDenied";

export function PermissionRoute({ permission }: { permission: string }) {
	const { loading, hasPermission } = useSession();

	if (loading) return null;

	return hasPermission(permission) ? <Outlet /> : <AccessDeniedPage />;
}
