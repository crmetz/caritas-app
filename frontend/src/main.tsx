import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";
import { AppLayout } from "./components/AppLayout";
import { PermissionRoute } from "./components/PermissionRoute";
import { PrivateRoute } from "./components/PrivateRoute";
import { SessionProvider } from "./components/SessionProvider";
import { Permissions } from "./constants/permissions";
import AtendimentoPage from "./pages/Atendimento";
import EvolucaoFamiliaPage from "./pages/EvolucaoFamilia";
import FamiliaPage from "./pages/Familia";
import LoginPage from "./pages/Login";
import ParoquiaPage from "./pages/Paroquia";
import PerfilPage from "./pages/Perfil";
import ResetPassowrdPage from "./pages/ResetPassword";
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
								<Route path="/familias" element={<FamiliaPage />} />
								<Route
									path="/familias/:familiaId/evolucao"
									element={<EvolucaoFamiliaPage />}
								/>
								<Route path="/atendimentos" element={<AtendimentoPage />} />
								<Route
									element={<PermissionRoute permission={Permissions.Paroquia.Visualizar} />}
								>
									<Route path="/paroquias" element={<ParoquiaPage />} />
								</Route>
								<Route
									element={<PermissionRoute permission={Permissions.Usuario.Visualizar} />}
								>
									<Route path="/usuarios" element={<UsuarioPage />} />
								</Route>
								<Route path="/perfis" element={<PerfilPage />} />
							</Route>
						</Route>
						<Route path="*" element={<Navigate to="/familias" replace />} />
					</Routes>
					<ToastContainer position="top-right" />
			</SessionProvider>
		</BrowserRouter>
	</StrictMode>,
);
