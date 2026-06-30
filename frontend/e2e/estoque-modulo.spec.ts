import { expect, test } from "@playwright/test";

test.describe("Módulo de Estoque (abas)", () => {
	test("navega entre as abas Alimentos, Roupas e Gêneros", async ({ page }) => {
		await page.goto("/estoque");
		await expect(
			page.getByRole("heading", { name: "Estoque", level: 1 }),
		).toBeVisible();

		// Alimentos (aba padrão): ação de adicionar item.
		await page.getByRole("tab", { name: "Alimentos" }).click();
		await expect(
			page.getByRole("button", { name: /Adicionar item/i }),
		).toBeVisible();

		// Roupas: filtro de categoria é exclusivo desta aba.
		await page.getByRole("tab", { name: "Roupas" }).click();
		await expect(page.getByLabel("Categoria")).toBeVisible();

		// Gêneros (catálogo de alimentos): ação "Novo alimento".
		await page.getByRole("tab", { name: "Gêneros" }).click();
		await expect(
			page.getByRole("button", { name: /Novo alimento/i }),
		).toBeVisible();
	});

	test("rotas antigas redirecionam para /estoque", async ({ page }) => {
		for (const rotaAntiga of [
			"/estoque-alimentos",
			"/estoque-roupas",
			"/alimentos",
		]) {
			await page.goto(rotaAntiga);
			await expect(page).toHaveURL(/\/estoque$/);
		}
	});
});
