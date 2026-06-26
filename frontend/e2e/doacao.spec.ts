import { expect, test } from "@playwright/test";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

test.describe("Doações", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/doacoes");
		await page.getByRole("button", { name: /Nova doação/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	// Ponto 7: RepeatableRows bloqueia nova linha vazia até a anterior estar completa.
	test("bloqueia adicionar item até a linha estar completa", async ({
		page,
	}) => {
		const dialog = page.getByRole("dialog");
		const addItem = dialog.getByRole("button", { name: /Adicionar item/i });

		await expect(addItem).toBeDisabled();
		await pickSearchable(dialog, /Selecione o item/i, "Arroz");
		await expect(addItem).toBeEnabled();
		await addItem.click();
		await expect(addItem).toBeDisabled();
	});

	test("registra doação de itens (alimento com medida)", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Maria da Silva");
		await pickSearchable(dialog, /Selecione o item/i, "Arroz");

		const medida = dialog.getByPlaceholder(/Ex\.:/i).first();
		await setQuantity(medida, "2kg");
		await expect(medida).toHaveValue("2 kg");

		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);
	});

	test("registra doação de cesta fechada", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Supermercado Central");
		await dialog.getByRole("tab", { name: /Cesta fechada/i }).click();
		await setQuantity(dialog.locator("#qtd-cestas"), "3");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);
	});

	test("exige doador", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione o item/i, "Arroz");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Selecione ou informe um doador/i);
	});

	test("exige ao menos um item", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione um doador/i, "Maria da Silva");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Adicione ao menos um item/i);
	});
});
