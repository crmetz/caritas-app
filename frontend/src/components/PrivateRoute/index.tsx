import { Navigate, Outlet } from "react-router-dom";

export function PrivateRoute() {
	//por enquanto assim, depois criar um userContext para acessar
	const token = localStorage.getItem("token");
	return token ? <Outlet /> : <Navigate to="/login" replace />;
}
