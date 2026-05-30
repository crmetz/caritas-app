import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";
import { AppLayout } from "./components/AppLayout";
import FamiliaPage from "./pages/Familia";
import ParoquiaPage from "./pages/Paroquia";
import UsuarioPage from "./pages/Usuario";
import LoginPage from "./pages/Login";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<BrowserRouter>
			<AppLayout>
				<Routes>
					<Route path="/" element={<FamiliaPage />} />
					<Route path="/paroquias" element={<ParoquiaPage />} />
					<Route path="/usuarios" element={<UsuarioPage />} />
				</Routes>
			</AppLayout>
			{/* <LoginPage /> */}
		</BrowserRouter>
		<ToastContainer position="top-right" />
	</StrictMode>,
);
