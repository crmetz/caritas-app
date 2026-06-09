import axios from "axios";

const api = axios.create({
	baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api`,
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
