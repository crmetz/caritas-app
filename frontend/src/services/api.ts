import axios from "axios";

// Em produção (imagem Docker) o VITE_API_URL vem vazio de propósito: as chamadas
// saem relativas ("/api") e o nginx faz o proxy para o backend. O fallback para
// localhost:8080 só vale em desenvolvimento — se vazasse para o build de produção,
// o navegador tentaria falar com a máquina do próprio usuário.
const apiUrl =
	import.meta.env.VITE_API_URL ??
	(import.meta.env.DEV ? "http://localhost:8080" : "");

const api = axios.create({
	baseURL: `${apiUrl}/api`,
});

export interface PagedResponse<T> {
	items: T[];
	totalCount: number;
}

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	const paroquiaId = localStorage.getItem("paroquiaAtualId");
	if (paroquiaId) {
		config.headers["X-Paroquia-Id"] = paroquiaId;
	}
	return config;
});

// Token expirado/inválido: limpa a sessão e volta ao login (evita ficar "preso" com 401 silencioso).
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (
			error?.response?.status === 401 &&
			window.location.pathname !== "/login"
		) {
			localStorage.removeItem("token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (
			axios.isAxiosError(error) &&
			error.response?.status === 403 &&
			!error.response?.data?.detail
		) {
			const method = error.config?.method?.toUpperCase();
			error.response.data = {
				detail:
					method === "GET"
						? "Você não tem permissão para acessar este recurso."
						: "Você não tem permissão para realizar esta ação.",
			};
		}
		return Promise.reject(error);
	},
);

export function getErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as
			| { detail?: string; title?: string }
			| undefined;
		return data?.detail || data?.title || fallback;
	}
	return fallback;
}

const APIService = {
	getRequest: <T>({ url, params }: { url: string; params?: object }) =>
		api.get<T>(url, { params }).then((r) => r.data),

	postRequest: <T>({ url, body }: { url: string; body: unknown }) =>
		api.post<T>(url, body).then((r) => r.data),

	putRequest: <T>({ url, body }: { url: string; body: unknown }) =>
		api.put<T>(url, body).then((r) => r.data),

	deleteRequest: <T>({ url }: { url: string }) =>
		api.delete<T>(url).then((r) => r.data),
};

export default APIService;
