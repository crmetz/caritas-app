import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api`,
});

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

// DEV ONLY — login automático com usuário seed
if (import.meta.env.DEV) {
  let tokenPromise: Promise<string> | null = null;

  const getDevToken = () => {
    if (!tokenPromise) {
      tokenPromise = axios
        .post(`${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/auth/login`, {
          email: "dev@caritas.com",
          password: "Dev@12345",
        })
        .then((r) => r.data.token);
    }
    return tokenPromise;
  };

  api.interceptors.request.use(async (config) => {
    const token = await getDevToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
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
