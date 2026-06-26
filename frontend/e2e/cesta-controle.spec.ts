import { expect, test } from "@playwright/test";
import { alimentoIdPorDescricao, entradaEstoque, makeApi } from "./api";
import { expectToast, pickSelect, setQuantity } from "./helpers";

// Roda em série e na ordem: a montagem cria um lote que a baixa depois consome.
test.describe.configure({ mode: "serial" });

test.describe("Cesta Básica — Montagem e Baixa", () => {
	test("montagem exige configuração e quantidade", async ({ page }) => {
		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /Continuar/i }).click();
		await expectToast(page, /Selecione a cesta e a quantidade/i);
	});

	test("monta cestas a partir de uma configuração", async ({ page, request }) => {
		// Garante estoque para a config do seed (o DB de dev pode estar depletado por execuções
		// repetidas). Repõe Arroz/Feijão/Óleo no tamanho usado pela "Cesta Básica Padrão".
		const api = await makeApi(request);
		for (const [nome, valor, unidade] of [
			["Arroz", 1, "kg"],
			["Feijão", 1, "kg"],
			["Óleo", 900, "ml"],
		] as const) {
			const id = await alimentoIdPorDescricao(api, nome);
			if (id)
				await entradaEstoque(api, {
					idItem: id,
					tamanhoValor: valor,
					tamanhoUnidade: unidade,
					quantidade: 10,
				});
		}

		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const dialog = page.getByRole("dialog");

		await pickSelect(page, dialog.getByRole("combobox"), /Cesta Básica Padrão/i);
		// Monta 3 para sobrar saldo para os testes de baixa seguintes.
		await setQuantity(dialog.locator("#qtd-montar"), "3");
		await dialog.getByRole("button", { name: /Continuar/i }).click();

		// Passo 2: a proposta já vem balanceada (estoque suficiente) → confirma.
		const confirmar = dialog.getByRole("button", {
			name: /Confirmar montagem/i,
		});
		await expect(confirmar).toBeEnabled();
		await confirmar.click();
		await expectToast(page, /cesta\(s\) montada\(s\)/i);
	});

	test("dá baixa em uma cesta do controle", async ({ page }) => {
		await page.goto("/cesta-basica");
		// Aba Controle é a default; usa o primeiro lote com saldo (botão habilitado).
		const baixa = page
			.getByRole("button", { name: "Baixa", exact: true })
			.and(page.locator(":enabled"))
			.first();
		await expect(baixa).toBeVisible();
		await baixa.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog.getByText(/Registrar movimentação/i)).toBeVisible();
		await setQuantity(dialog.locator("#qtd-baixa"), "1");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Movimentação registrada/i);
	});

	test("quantidade de baixa é limitada ao saldo (clamp)", async ({ page }) => {
		await page.goto("/cesta-basica");
		const baixa = page
			.getByRole("button", { name: "Baixa", exact: true })
			.and(page.locator(":enabled"))
			.first();
		await baixa.click();
		const dialog = page.getByRole("dialog");
		const qtd = dialog.locator("#qtd-baixa");
		await setQuantity(qtd, "999999");
		await expect(qtd).not.toHaveValue("999999");
		await expect(qtd).not.toHaveValue("");
	});
});
