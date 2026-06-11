import APIService from "@/services/api";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { Session, SelectObject, SessionContextValue } from "./interface";

const PAROQUIA_STORAGE_KEY = "paroquiaAtualId";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const [paroquiaAtual, setParoquiaAtualState] = useState<SelectObject | null>(
		null,
	);

	const setParoquiaAtual = useCallback((paroquia: SelectObject) => {
		setParoquiaAtualState(paroquia);
		localStorage.setItem(PAROQUIA_STORAGE_KEY, String(paroquia.value));
	}, []);

	const refreshSession = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setSession(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const data = await APIService.getRequest<Session>({
				url: "/auth/session",
			});
			setSession(data);

			const stored = localStorage.getItem(PAROQUIA_STORAGE_KEY);
			const fromStorage = data.paroquiasPermitidas.find(
				(p) => String(p.value) === stored,
			);
			const selecionada = fromStorage ?? data.paroquiasPermitidas[0] ?? null;
			if (selecionada) {
				setParoquiaAtual(selecionada);
			} else {
				setParoquiaAtualState(null);
				localStorage.removeItem(PAROQUIA_STORAGE_KEY);
			}
		} finally {
			setLoading(false);
		}
	}, [setParoquiaAtual]);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("nome");
		localStorage.removeItem(PAROQUIA_STORAGE_KEY);
		setSession(null);
		setParoquiaAtualState(null);
	}, []);

	useEffect(() => {
		void refreshSession();
	}, [refreshSession]);

	return (
		<SessionContext.Provider
			value={{
				session,
				loading,
				paroquiaAtual,
				setParoquiaAtual,
				refreshSession,
				logout,
			}}
		>
			{children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSession deve ser usado dentro de um SessionProvider");
	}
	return context;
}
