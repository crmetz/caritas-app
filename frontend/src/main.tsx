import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";
import { AppLayout } from "./components/AppLayout";
import { PrivateRoute } from "./components/PrivateRoute";
import { SessionProvider } from "./components/SessionProvider";
import LoginPage from "./pages/Login";
import ResetPassowrdPage from "./pages/ResetPassword";
import BrechoPage from "./pages/Brecho";
import BrechoVendaPage from "./pages/BrechoVenda";
import FamiliaPage from "./pages/Familia";
import ParoquiaPage from "./pages/Paroquia";
import UsuarioPage from "./pages/Usuario";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<BrowserRouter>
			<SessionProvider>
				<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/redefinir-senha" element={<ResetPassowrdPage />} />
				<Route element={<PrivateRoute />}>
					<Route element={<AppLayout />}>
						<Route path="/" element={<FamiliaPage />} />
						<Route path="/paroquias" element={<ParoquiaPage />} />
						<Route path="/usuarios" element={<UsuarioPage />} />
						<Route path="/brecho" element={<BrechoPage />} />
						<Route path="/brecho/nova-venda" element={<BrechoVendaPage />} />
					</Route>
				</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
				<ToastContainer position="top-right" />
			</SessionProvider>
		</BrowserRouter>
	</StrictMode>,
);
