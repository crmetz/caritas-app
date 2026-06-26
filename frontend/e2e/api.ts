import { type APIRequestContext, expect } from "@playwright/test";

// Helper de API para os testes E2E "híbridos": os fluxos são exercitados pela UI, mas a conferência
// de saldos/quantidades e a preparação determinística de pré-condições passam por aqui.

const BASE = process.env.E2E_API_URL ?? "http://localhost:8080/api";
const EMAIL = process.env.E2E_EMAIL ?? "dev@caritas.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "Dev@12345";

export interface PagedResponse<T> {
	items: T[];
	totalCount: number;
}

export interface EstoqueAlimentoItem {
	id: number;
	idItem: number;
	descricao: string;
	quantidade: number;
	tamanho: number | null;
	validade: string | null;
	lote: string | null;
}

export interface EstoqueRoupaItem {
	id: number;
	idItem: number;
	descricao: string;
	quantidade: number;
	lote: string | null;
}

export interface LoteCestaItem {
	id: number;
	origem: string;
	quantidade: number;
	quantidadeDisponivel: number;
	nomeConfiguracao: string | null;
}

export interface Api {
	headers: Record<string, string>;
	get<T>(path: string): Promise<T>;
	post<T>(path: string, body: unknown): Promise<T>;
}

export async function makeApi(request: APIRequestContext): Promise<Api> {
	const loginRes = await request.post(`${BASE}/auth/login`, {
		data: { email: EMAIL, password: PASSWORD },
	});
	expect(loginRes.ok(), "login da API").toBeTruthy();
	const { token } = (await loginRes.json()) as { token: string };

	const sessRes = await request.get(`${BASE}/auth/session`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const session = (await sessRes.json()) as {
		paroquiasPermitidas: { value: number }[];
	};
	const paroquiaId = String(session.paroquiasPermitidas?.[0]?.value ?? "");
	const headers = {
		Authorization: `Bearer ${token}`,
		"X-Paroquia-Id": paroquiaId,
	};

	return {
		headers,
		async get<T>(path: string): Promise<T> {
			const res = await request.get(`${BASE}${path}`, { headers });
			expect(res.ok(), `GET ${path} (${res.status()})`).toBeTruthy();
			return (await res.json()) as T;
		},
		async post<T>(path: string, body: unknown): Promise<T> {
			const res = await request.post(`${BASE}${path}`, { headers, data: body });
			expect(res.ok(), `POST ${path} (${res.status()})`).toBeTruthy();
			return (res.status() === 204 ? undefined : await res.json()) as T;
		},
	};
}

// ── Leituras de saldo ────────────────────────────────────────────────────────

export async function somaPacotesAlimento(
	api: Api,
	idItem: number,
): Promise<number> {
	const data = await api.get<PagedResponse<EstoqueAlimentoItem>>(
		"/estoque/alimentos?page=1&pageSize=500",
	);
	return data.items
		.filter((i) => i.idItem === idItem)
		.reduce((s, i) => s + i.quantidade, 0);
}

export async function somaPecasRoupa(
	api: Api,
	descricao: string,
): Promise<number> {
	const data = await api.get<PagedResponse<EstoqueRoupaItem>>(
		"/estoque/roupas?page=1&pageSize=500",
	);
	return data.items
		.filter((i) => i.descricao === descricao)
		.reduce((s, i) => s + i.quantidade, 0);
}

export async function totalCestasDisponiveis(api: Api): Promise<number> {
	const data = await api.get<PagedResponse<LoteCestaItem>>(
		"/lotes-cesta?page=1&pageSize=500",
	);
	return data.items.reduce((s, l) => s + l.quantidadeDisponivel, 0);
}

export async function alimentoIdPorDescricao(
	api: Api,
	descricao: string,
): Promise<number | undefined> {
	const list = await api.get<{ id: number; descricao: string }[]>(
		"/itens/alimentos",
	);
	return list.find((a) => a.descricao === descricao)?.id;
}

// ── Preparação determinística (setup) ────────────────────────────────────────

export async function criarAlimento(
	api: Api,
	descricao: string,
	formaMedida: "Peso" | "Volume" | "Unidade" = "Peso",
): Promise<number> {
	const r = await api.post<{ id: number }>("/itens/alimentos", {
		descricao,
		formaMedida,
	});
	return r.id;
}

export async function entradaEstoque(
	api: Api,
	body: {
		idItem: number;
		tamanhoValor?: number | null;
		tamanhoUnidade?: string | null;
		validade?: string | null;
		lote?: string | null;
		quantidade: number;
	},
): Promise<void> {
	await api.post("/movimentacoes", {
		...body,
		tipoOperacao: "Entrada",
		origemTipo: "Ajuste",
	});
}

export async function criarConfiguracao(
	api: Api,
	nome: string,
	itens: {
		idAlimento: number;
		tamanhoValor: number;
		tamanhoUnidade: string;
		quantidadePacotes: number;
	}[],
): Promise<{ id: number }> {
	return api.post<{ id: number }>("/configuracoes-cesta", { nome, itens });
}
