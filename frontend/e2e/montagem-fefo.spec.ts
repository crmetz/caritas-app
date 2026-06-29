import { expect, test } from "@playwright/test";
import {
	type Api,
	type EstoqueAlimentoItem,
	type PagedResponse,
	criarAlimento,
	criarConfiguracao,
	entradaEstoque,
	makeApi,
	somaPacotesAlimento,
	totalCestasDisponiveis,
} from "./api";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

function isoEmDias(dias: number): string {
	const d = new Date();
	d.setDate(d.getDate() + dias);
	return d.toISOString().slice(0, 10);
}

async function saldoLote(api: Api, idItem: number, lote: string): Promise<number> {
	const d = await api.get<PagedResponse<EstoqueAlimentoItem>>(
		"/estoque/alimentos?page=1&pageSize=500",
	);
	return d.items.find((i) => i.idItem === idItem && i.lote === lote)?.quantidade ?? 0;
}

// Cria um alimento (Peso) com dois lotes — um vencendo antes, outro depois — e uma configuração
// que consome 2 pacotes desse alimento por cesta. Retorna os identificadores usados nas asserções.
async function cenarioDoisLotes(api: Api, sufixo: string) {
	const nomeAlim = `FEFO ${sufixo}`;
	const idItem = await criarAlimento(api, nomeAlim, "Peso");
	await entradaEstoque(api, {
		idItem,
		tamanhoValor: 1,
		tamanhoUnidade: "kg",
		validade: isoEmDias(30), // vence antes → deve ser sugerido primeiro
		lote: "FEFO-A",
		quantidade: 10,
	});
	await entradaEstoque(api, {
		idItem,
		tamanhoValor: 1,
		tamanhoUnidade: "kg",
		validade: isoEmDias(200), // vence depois
		lote: "FEFO-B",
		quantidade: 10,
	});
	const nomeConfig = `Config FEFO ${sufixo}`;
	await criarConfiguracao(api, nomeConfig, [
		{ idAlimento: idItem, tamanhoValor: 1, tamanhoUnidade: "kg", quantidadePacotes: 2 },
	]);
	return { idItem, nomeConfig };
}

test.describe("Montagem de Cestas — FEFO e consumo de lotes", () => {
	test("§12.3 sugere primeiro o lote com vencimento mais próximo (FEFO)", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const { nomeConfig } = await cenarioDoisLotes(api, `${Date.now()}`);

		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a cesta/i, new RegExp(nomeConfig));
		await setQuantity(dialog.locator("#qtd-montar"), "1");
		await dialog.getByRole("button", { name: /Continuar/i }).click();

		// O lote FEFO-A (mais próximo) recebe a sugestão (2); FEFO-B fica em 0.
		const rowA = dialog
			.locator("div:has(input)")
			.filter({ hasText: "FEFO-A" })
			.last();
		const rowB = dialog
			.locator("div:has(input)")
			.filter({ hasText: "FEFO-B" })
			.last();
		await expect(rowA.getByRole("spinbutton")).toHaveValue("2");
		await expect(rowB.getByRole("spinbutton")).toHaveValue("0");
	});

	test("§12.1/§13.1 montagem consome o lote sugerido e move os estoques", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const { idItem, nomeConfig } = await cenarioDoisLotes(api, `${Date.now()}`);
		const estoqueAntes = await somaPacotesAlimento(api, idItem); // 20
		const cestasAntes = await totalCestasDisponiveis(api);

		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a cesta/i, new RegExp(nomeConfig));
		await setQuantity(dialog.locator("#qtd-montar"), "1");
		await dialog.getByRole("button", { name: /Continuar/i }).click();
		await dialog.getByRole("button", { name: /Confirmar montagem/i }).click();
		await expectToast(page, /cesta\(s\) montada\(s\)/i);

		// Controle +1 cesta; estoque -2 pacotes; consumo veio do lote FEFO-A (sugerido).
		expect(await totalCestasDisponiveis(api)).toBe(cestasAntes + 1);
		expect(await somaPacotesAlimento(api, idItem)).toBe(estoqueAntes - 2);
		expect(await saldoLote(api, idItem, "FEFO-A")).toBe(8);
		expect(await saldoLote(api, idItem, "FEFO-B")).toBe(10);
	});

	test("§12.2 troca manual de lote consome o escolhido e preserva o sugerido", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const { idItem, nomeConfig } = await cenarioDoisLotes(api, `${Date.now()}`);

		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a cesta/i, new RegExp(nomeConfig));
		await setQuantity(dialog.locator("#qtd-montar"), "1");
		await dialog.getByRole("button", { name: /Continuar/i }).click();

		const rowA = dialog
			.locator("div:has(input)")
			.filter({ hasText: "FEFO-A" })
			.last();
		const rowB = dialog
			.locator("div:has(input)")
			.filter({ hasText: "FEFO-B" })
			.last();

		// Move a alocação do lote sugerido (A) para o lote B.
		await setQuantity(rowA.getByRole("spinbutton"), "0");
		await setQuantity(rowB.getByRole("spinbutton"), "2");

		const confirmar = dialog.getByRole("button", { name: /Confirmar montagem/i });
		await expect(confirmar).toBeEnabled();
		await confirmar.click();
		await expectToast(page, /cesta\(s\) montada\(s\)/i);

		// O lote escolhido (B) foi consumido; o sugerido (A) ficou intacto.
		expect(await saldoLote(api, idItem, "FEFO-B")).toBe(8);
		expect(await saldoLote(api, idItem, "FEFO-A")).toBe(10);
	});
});
