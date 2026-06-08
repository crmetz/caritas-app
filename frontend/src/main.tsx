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
import BazarPage from "./pages/Bazar";
import BazarRelatorioPage from "./pages/BazarRelatorio";
import BazarVendaPage from "./pages/BazarVenda";
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
						<Route path="/bazar" element={<BazarPage />} />
						<Route path="/bazar/nova-venda" element={<BazarVendaPage />} />
						<Route path="/bazar/relatorio" element={<BazarRelatorioPage />} />
					</Route>
				</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
				<ToastContainer position="top-right" />
			</SessionProvider>
		</BrowserRouter>
	</StrictMode>,
);
