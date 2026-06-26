import { expect, test } from "@playwright/test";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

test.describe("Entregas", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/entregas");
		await page.getByRole("button", { name: /Nova entrega/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("registra entrega de alimento a uma família", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");

		await dialog.getByRole("tab", { name: /Alimentos/i }).click();
		await pickSearchable(dialog, /Selecione o item em estoque/i, /Arroz/);
		// quantidade padrão 1 já preenchida no QuantityInput count.

		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Entrega registrada/i);
	});

	test("bloqueia adicionar item até a linha estar completa", async ({
		page,
	}) => {
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("tab", { name: /Alimentos/i }).click();
		const addItem = dialog.getByRole("button", { name: /Adicionar item/i });
		await expect(addItem).toBeDisabled();
		await pickSearchable(dialog, /Selecione o item em estoque/i, /Arroz/);
		await expect(addItem).toBeEnabled();
		await addItem.click();
		await expect(addItem).toBeDisabled();
	});

	test("exige a família beneficiária", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Selecione a família beneficiária/i);
	});

	test("exige ao menos uma cesta ou item", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Adicione ao menos uma cesta ou item/i);
	});

	test("entrega acima do estoque é bloqueada", async ({ page }) => {
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");
		await dialog.getByRole("tab", { name: /Alimentos/i }).click();
		await pickSearchable(dialog, /Selecione o item em estoque/i, /Arroz/);
		await setQuantity(dialog.getByRole("spinbutton").first(), "999999");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /tem só .* disponível/i);
	});
});
