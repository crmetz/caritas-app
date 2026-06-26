import { expect, test } from "@playwright/test";
import { expectToast, pickDate, pickSelect, setQuantity } from "./helpers";

test.describe("Estoque de Alimentos", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/estoque-alimentos");
	});

	// ── Entrada ──────────────────────────────────────────────────────────────
	test("registra entrada com QuantityInput (medida) e DatePicker", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		await pickSelect(page, dialog.getByRole("combobox"), "Arroz");

		const tamanho = dialog.locator("#tamanho");
		await setQuantity(tamanho, "2kg");
		await expect(tamanho).toHaveValue("2 kg");

		await setQuantity(dialog.locator("#quantity"), "5");
		await pickDate(page, dialog.locator("#expiry"));

		await dialog.getByRole("button", { name: /Registrar entrada/i }).click();
		await expectToast(page, /Entrada registrada com sucesso/i);
	});

	test("normaliza valor válido e limpa valor inválido no blur (medida)", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSelect(page, dialog.getByRole("combobox"), "Óleo");

		const tamanho = dialog.locator("#tamanho");
		await setQuantity(tamanho, "500ml");
		await expect(tamanho).toHaveValue("500 ml");

		await setQuantity(tamanho, "abc");
		await expect(tamanho).toHaveValue("");

		// Unidade incompatível com a forma (Óleo é Volume) também é rejeitada.
		await setQuantity(tamanho, "2kg");
		await expect(tamanho).toHaveValue("");
	});

	test("entrada exige campos obrigatórios", async ({ page }) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /Registrar entrada/i }).click();
		await expect(dialog.getByText(/Selecione o alimento/i)).toBeVisible();
		await expect(dialog.getByText(/Informe a validade/i)).toBeVisible();
	});

	// ── Saída ────────────────────────────────────────────────────────────────
	test('motivos de saída não contêm "Utilização"', async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("combobox").click();
		const options = page.getByRole("option");
		await expect(options.filter({ hasText: /Utilização/i })).toHaveCount(0);
		await expect(options.filter({ hasText: /Descarte/i })).toHaveCount(1);
	});

	test("registra saída válida", async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		await setQuantity(dialog.locator("#qtd-saida"), "1");
		await dialog.getByRole("button", { name: /Registrar saída/i }).click();
		await expectToast(page, /Saída registrada/i);
	});

	test("quantidade de saída é limitada ao saldo (clamp)", async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		const qtd = dialog.locator("#qtd-saida");
		await setQuantity(qtd, "999999");
		// O QuantityInput (count com max) normaliza para o saldo disponível, nunca acima.
		await expect(qtd).not.toHaveValue("999999");
		await expect(qtd).not.toHaveValue("");
	});

	test("saída com quantidade inválida é bloqueada", async ({ page }) => {
		await page.getByRole("button", { name: /Saída/i }).first().click();
		const dialog = page.getByRole("dialog");
		const qtd = dialog.locator("#qtd-saida");
		await qtd.fill("");
		await qtd.blur();
		await dialog.getByRole("button", { name: /Registrar saída/i }).click();
		await expectToast(page, /Quantidade inválida/i);
	});
});
