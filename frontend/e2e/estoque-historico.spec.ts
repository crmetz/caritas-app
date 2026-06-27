import { expect, test } from "@playwright/test";
import { criarAlimento, entradaEstoque, makeApi } from "./api";
import { gotoEstoque, pickSelect } from "./helpers";

// §2 Histórico de estoque: a aba deve dar rastreabilidade às movimentações (entradas e saídas).
test("aba Histórico exibe a entrada e a saída de um item", async ({
	page,
	request,
}) => {
	const api = await makeApi(request);
	const nome = `Hist E2E ${Date.now()}`;
	const idItem = await criarAlimento(api, nome, "Peso");

	// Entrada (5) e saída por descarte (2) — viram as movimentações mais recentes.
	await entradaEstoque(api, {
		idItem,
		tamanhoValor: 1,
		tamanhoUnidade: "kg",
		validade: "2026-12-31",
		lote: "L-HIST",
		quantidade: 5,
	});
	await api.post("/movimentacoes", {
		idItem,
		tamanhoValor: 1,
		tamanhoUnidade: "kg",
		validade: "2026-12-31",
		lote: "L-HIST",
		tipoOperacao: "Saida",
		quantidade: 2,
		origemTipo: "Descarte",
	});

	await gotoEstoque(page, "Histórico");

	const linhaEntrada = page
		.getByRole("row")
		.filter({ hasText: nome })
		.filter({ hasText: "Entrada" });
	const linhaSaida = page
		.getByRole("row")
		.filter({ hasText: nome })
		.filter({ hasText: "Saída" });

	await expect(linhaEntrada).toHaveCount(1);
	await expect(linhaSaida).toHaveCount(1);
	await expect(linhaEntrada).toContainText("+5");
	await expect(linhaSaida).toContainText("Descarte");
});

// Filtro por tipo de item (filtrado no backend): separa alimentos e roupas.
test("aba Histórico filtra por tipo de item (Alimento/Roupa)", async ({
	page,
	request,
}) => {
	const api = await makeApi(request);
	const sufixo = Date.now();
	const nomeAlim = `Hist Alim ${sufixo}`;
	const nomeRoupa = `Hist Roupa ${sufixo}`;

	const idAlim = await criarAlimento(api, nomeAlim, "Peso");
	await entradaEstoque(api, {
		idItem: idAlim,
		tamanhoValor: 1,
		tamanhoUnidade: "kg",
		quantidade: 3,
	});

	const roupa = await api.post<{ id: number }>("/itens/roupas", {
		descricao: nomeRoupa,
		categoria: "Casaco",
	});
	await api.post("/movimentacoes", {
		idItem: roupa.id,
		tipoOperacao: "Entrada",
		quantidade: 4,
		origemTipo: "Ajuste",
	});

	await gotoEstoque(page, "Histórico");

	// Tipo = Roupa: aparece a roupa, some o alimento.
	await pickSelect(page, page.getByLabel("Tipo"), "Roupa");
	await expect(page.getByRole("row").filter({ hasText: nomeRoupa })).toHaveCount(
		1,
	);
	await expect(page.getByRole("row").filter({ hasText: nomeAlim })).toHaveCount(
		0,
	);

	// Tipo = Alimento: inverte.
	await pickSelect(page, page.getByLabel("Tipo"), "Alimento");
	await expect(page.getByRole("row").filter({ hasText: nomeAlim })).toHaveCount(
		1,
	);
	await expect(page.getByRole("row").filter({ hasText: nomeRoupa })).toHaveCount(
		0,
	);
});
