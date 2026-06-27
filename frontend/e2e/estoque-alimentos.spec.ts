import { expect, test } from "@playwright/test";
import { criarAlimento, entradaEstoque, makeApi } from "./api";
import {
	expectToast,
	gotoEstoque,
	pickDate,
	pickSelect,
	setQuantity,
} from "./helpers";

test.describe("Estoque de Alimentos", () => {
	test.beforeEach(async ({ page }) => {
		await gotoEstoque(page, "Alimentos");
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

	test('sugestão de medida não inclui "t" até o usuário digitar "t"', async ({
		page,
	}) => {
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSelect(page, dialog.getByRole("combobox"), "Arroz");

		const tamanho = dialog.locator("#tamanho");
		await tamanho.fill("1");
		// Peso sugere g e kg, mas não tonelada (evita valores massivos por engano).
		await expect(
			dialog.getByRole("button", { name: "1 g", exact: true }),
		).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "1 kg", exact: true }),
		).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "1 t", exact: true }),
		).toHaveCount(0);

		// Ao começar a digitar "t", a tonelada passa a ser sugerida.
		await tamanho.fill("1t");
		await expect(
			dialog.getByRole("button", { name: "1 t", exact: true }),
		).toBeVisible();
	});

	test("Resumo por alimento mostra só a 1ª linha e expande o restante", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const sufixo = Date.now();
		// Vários gêneros com estoque, nomeados para ordenar por último (resumo é alfabético) —
		// garante que fiquem além da primeira linha.
		for (const l of ["a", "b", "c", "d", "e", "f"]) {
			const id = await criarAlimento(api, `ZZZ Resumo ${sufixo} ${l}`, "Peso");
			await entradaEstoque(api, {
				idItem: id,
				tamanhoValor: 1,
				tamanhoUnidade: "kg",
				validade: "2026-12-31",
				quantidade: 1,
			});
		}
		await page.reload();

		const resumo = page.getByTestId("resumo-alimentos");
		const ultimo = resumo.getByText(`ZZZ Resumo ${sufixo} f`, { exact: true });

		// Recolhido (padrão): o último card fica oculto.
		await expect(ultimo).toBeHidden();

		// Expandir revela; recolher esconde de novo.
		await page.getByRole("button", { name: /Ver todos/i }).click();
		await expect(ultimo).toBeVisible();
		await page.getByRole("button", { name: /Ver menos/i }).click();
		await expect(ultimo).toBeHidden();
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
