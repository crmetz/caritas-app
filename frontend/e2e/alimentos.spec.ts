import { expect, test } from "@playwright/test";
import { gotoEstoque } from "./helpers";

// Ponto 6: alimento em uso não pode ser excluído — o DataTable oculta o botão de excluir.
test("alimento em uso não exibe botão de excluir", async ({ page }) => {
	await gotoEstoque(page, "Gêneros");
	await page.getByPlaceholder(/Buscar por nome/i).fill("Arroz");

	// Arroz (gênero do seed) é usado no estoque/cesta → não excluível. Casa a célula exata para
	// não pegar alimentos de teste que contêm "Arroz" no nome (ex.: "Cadeia Arroz 123").
	const linhaArroz = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "Arroz", exact: true }) })
		.first();
	await expect(linhaArroz).toBeVisible();

	// Sem botão "Excluir" (em uso); o de "Editar" permanece.
	await expect(
		linhaArroz.getByRole("button", { name: "Excluir" }),
	).toHaveCount(0);
	await expect(
		linhaArroz.getByRole("button", { name: "Editar" }),
	).toBeVisible();
});
