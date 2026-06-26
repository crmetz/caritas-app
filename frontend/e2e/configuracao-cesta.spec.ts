import { expect, test } from "@playwright/test";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

test.describe("Configuração de Cesta", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/cesta-basica");
		await page.getByRole("tab", { name: /Configurações/i }).click();
	});

	test("cria configuração com gating de itens (medida + pacotes)", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /Nova configuração/i }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const addItem = dialog.getByRole("button", { name: /Adicionar item/i });
		await expect(addItem).toBeDisabled();

		await dialog.locator("#nome").fill(`Cesta E2E ${Date.now()}`);
		await pickSearchable(dialog, /Alimento/i, "Feijão");

		// Campo de medida da linha (placeholder com unidades) — não confundir com o Nome.
		const medida = dialog.getByPlaceholder(/kg|ml|un/i).first();
		await setQuantity(medida, "1kg");
		await expect(medida).toHaveValue("1 kg");

		// Linha completa → permite adicionar nova linha.
		await expect(addItem).toBeEnabled();

		await dialog.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Configuração criada/i);
	});

	test("exige nome da cesta", async ({ page }) => {
		await page.getByRole("button", { name: /Nova configuração/i }).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Informe o nome da cesta/i);
	});

	test("edita uma configuração existente", async ({ page }) => {
		// Edita a primeira configuração da lista (seed garante "Cesta Básica Padrão").
		const linha = page.getByRole("row").nth(1);
		await linha.getByRole("button").first().click(); // lápis (editar)
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(/Editar configuração/i)).toBeVisible();
		await dialog.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Configuração atualizada/i);
	});

	test("exclui uma configuração criada", async ({ page }) => {
		const nome = `Cesta E2E Del ${Date.now()}`;

		// Cria uma configuração descartável.
		await page.getByRole("button", { name: /Nova configuração/i }).click();
		const dialog = page.getByRole("dialog");
		await dialog.locator("#nome").fill(nome);
		await pickSearchable(dialog, /Alimento/i, "Arroz");
		const medidaDel = dialog.getByPlaceholder(/kg|ml|un/i).first();
		await setQuantity(medidaDel, "1kg");
		await expect(medidaDel).toHaveValue("1 kg"); // sincroniza antes de salvar
		await dialog.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Configuração criada/i);

		// Exclui pela linha correspondente.
		const linha = page.getByRole("row", { name: new RegExp(nome) });
		await expect(linha).toBeVisible();
		await linha.getByRole("button").last().click(); // lixeira
		await page.getByRole("button", { name: /^Excluir$/ }).click();
		await expectToast(page, /Configuração excluída/i);
	});
});
