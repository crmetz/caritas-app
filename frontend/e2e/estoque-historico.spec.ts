import { expect, test } from "@playwright/test";
import { criarAlimento, entradaEstoque, makeApi } from "./api";
import { gotoEstoque } from "./helpers";

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
