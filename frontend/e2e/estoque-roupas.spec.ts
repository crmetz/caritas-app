import { expect, test } from "@playwright/test";
import { expectToast, pickSelect, setQuantity } from "./helpers";

test.describe("Estoque de Roupas", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/estoque-roupas");
	});

	test("registra entrada de roupa", async ({ page }) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		await dialog.locator("#descricao").fill("Bermuda cinza E2E");
		await pickSelect(page, dialog.locator("#categoria"), /\w+/);
		await setQuantity(dialog.locator("#quantidade"), "7");

		await dialog.getByRole("button", { name: /^Adicionar$/ }).click();
		await expectToast(page, /Item adicionado com sucesso/i);
	});

	test("entradas idênticas consolidam em uma única linha", async ({ page }) => {
		const nome = `Casaco Consolida ${Date.now()}`;

		const registrarEntrada = async (qtd: string) => {
			await page.getByRole("button", { name: /Adicionar item/i }).click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await dialog.locator("#descricao").fill(nome);
			await pickSelect(page, dialog.locator("#categoria"), /^Casaco$/);
			await setQuantity(dialog.locator("#quantidade"), qtd);
			await dialog.getByRole("button", { name: /^Adicionar$/ }).click();
			await expectToast(page, /Item adicionado com sucesso/i);
			await expect(dialog).not.toBeVisible();
		};

		await registrarEntrada("3");
		await registrarEntrada("5");

		// Filtra pelo nome único: o dedupe do backend deve ter consolidado as duas
		// entradas em um único item, somando as quantidades (3 + 5 = 8).
		await page.getByLabel("Buscar").fill(nome);

		const row = page.getByRole("row").filter({ hasText: nome });
		await expect(row).toHaveCount(1);
		await expect(row.locator("td").nth(4)).toHaveText("8");
	});

	test("entrada exige nome, categoria e quantidade", async ({ page }) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /^Adicionar$/ }).click();
		await expect(dialog.getByText(/Informe o nome/i)).toBeVisible();
		await expect(dialog.getByText(/Selecione a categoria/i)).toBeVisible();
		await expect(dialog.getByText(/Quantidade inválida/i)).toBeVisible();
	});

	test("registra saída de roupa", async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		await setQuantity(dialog.locator("#qtd-saida-roupa"), "1");
		await dialog.getByRole("button", { name: /Registrar saída/i }).click();
		await expectToast(page, /Saída registrada/i);
	});

	test("quantidade de saída é limitada ao saldo (clamp)", async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		const qtd = dialog.locator("#qtd-saida-roupa");
		await setQuantity(qtd, "999999");
		await expect(qtd).not.toHaveValue("999999");
		await expect(qtd).not.toHaveValue("");
	});
});
