import { expect, test } from "@playwright/test";
import { expectToast, gotoEstoque, pickSelect, setQuantity } from "./helpers";

test.describe("Estoque de Roupas", () => {
	test.beforeEach(async ({ page }) => {
		await gotoEstoque(page, "Roupas");
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

	test("adiciona mais peças a um lote existente", async ({ page }) => {
		const nome = `Camisa Lote ${Date.now()}`;

		// Cria o item com quantidade inicial 2.
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const novo = page.getByRole("dialog");
		await novo.locator("#descricao").fill(nome);
		await pickSelect(page, novo.locator("#categoria"), /^Camisa$/);
		await setQuantity(novo.locator("#quantidade"), "2");
		await novo.getByRole("button", { name: /^Adicionar$/ }).click();
		await expectToast(page, /Item adicionado com sucesso/i);
		await expect(novo).not.toBeVisible();

		// Isola a linha pelo nome único.
		await page.getByLabel("Buscar").fill(nome);
		const row = page.getByRole("row").filter({ hasText: nome });
		await expect(row).toHaveCount(1);
		await expect(row.locator("td").nth(4)).toHaveText("2");

		// Usa a ação "Adicionar" da própria linha para somar 5 ao lote.
		await row.getByRole("button", { name: /Adicionar/i }).click();
		const entrada = page.getByRole("dialog");
		await setQuantity(entrada.locator("#qtd-entrada-roupa"), "5");
		await entrada.getByRole("button", { name: /Registrar entrada/i }).click();
		await expectToast(page, /Entrada registrada/i);

		// Saldo consolidado: 2 + 5 = 7.
		await expect(row.locator("td").nth(4)).toHaveText("7");
	});

	test("clicar fora não fecha o modal (Esc fecha)", async ({ page }) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await dialog.locator("#descricao").fill("Não pode sumir");

		// Clique fora (sobre o overlay, longe do modal centralizado): não deve fechar.
		await page.mouse.click(5, 5);
		await expect(dialog).toBeVisible();
		await expect(dialog.locator("#descricao")).toHaveValue("Não pode sumir");

		// Esc continua fechando.
		await page.keyboard.press("Escape");
		await expect(dialog).toBeHidden();
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
