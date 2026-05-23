import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";
import { AppLayout } from "./components/AppLayout";
import FamiliaPage from "./pages/Familia";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<FamiliaPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
    <ToastContainer position="top-right" />
  </StrictMode>,
);
