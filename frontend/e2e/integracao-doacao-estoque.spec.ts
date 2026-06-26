import { expect, test } from "@playwright/test";
import {
	criarAlimento,
	makeApi,
	somaPacotesAlimento,
	somaPecasRoupa,
	totalCestasDisponiveis,
} from "./api";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

// §9 Integração Doações → Estoque: toda doação gera entrada automática no controle correspondente.
test.describe("Integração Doação → Estoque", () => {
	test("doação de alimentos entra automaticamente no estoque", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const nome = `Doação Arroz E2E ${Date.now()}`;
		const idItem = await criarAlimento(api, nome, "Peso");
		const antes = await somaPacotesAlimento(api, idItem); // 0

		await page.goto("/doacoes");
		await page.getByRole("button", { name: /Nova doação/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Maria da Silva");
		await pickSearchable(dialog, /Selecione o item/i, nome);
		const medida = dialog.getByPlaceholder(/Ex\.:/i).first();
		await setQuantity(medida, "1kg");
		await expect(medida).toHaveValue("1 kg"); // aguarda normalização antes da qtd
		await setQuantity(dialog.getByRole("spinbutton").first(), "5");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);

		// A doação aparece no histórico e o estoque foi incrementado em exatamente 5 pacotes.
		await expect(page.getByRole("table")).toBeVisible();
		expect(await somaPacotesAlimento(api, idItem)).toBe(antes + 5);
	});

	test("doação de roupas entra automaticamente no estoque de roupas", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const antes = await somaPecasRoupa(api, "Camiseta branca");

		await page.goto("/doacoes");
		await page.getByRole("button", { name: /Nova doação/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Maria da Silva");
		await pickSearchable(dialog, /Selecione o item/i, "Camiseta branca");
		await setQuantity(dialog.getByRole("spinbutton").first(), "3");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);

		expect(await somaPecasRoupa(api, "Camiseta branca")).toBe(antes + 3);
	});

	test("doação de cestas fechadas entra no controle de cestas", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const antes = await totalCestasDisponiveis(api);

		await page.goto("/doacoes");
		await page.getByRole("button", { name: /Nova doação/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Supermercado Central");
		await dialog.getByRole("tab", { name: /Cesta fechada/i }).click();
		await setQuantity(dialog.locator("#qtd-cestas"), "4");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);

		expect(await totalCestasDisponiveis(api)).toBe(antes + 4);
	});
});
