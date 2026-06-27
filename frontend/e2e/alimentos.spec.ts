import { expect, test } from "@playwright/test";
import { gotoEstoque } from "./helpers";

// Ponto 6: alimento em uso não pode ser excluído — botão desabilitado + tooltip explicativo.
test("alimento em uso mostra tooltip e botão de excluir desabilitado", async ({
	page,
}) => {
	await gotoEstoque(page, "Gêneros");

	// Arroz (gênero do seed) é usado no estoque/cesta → não excluível. Casa a célula exata para não
	// pegar alimentos criados nos testes que contêm "Arroz" no nome (ex.: "Cadeia Arroz 123").
	const linhaArroz = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "Arroz", exact: true }) })
		.first();
	await expect(linhaArroz).toBeVisible();

	// O botão de excluir (envolto num span por estar desabilitado) deve estar desabilitado.
	const excluir = linhaArroz.getByRole("button").last();
	await expect(excluir).toBeDisabled();

	// Ao passar o mouse no gatilho, surge o tooltip explicativo.
	await linhaArroz.locator("span").last().hover();
	await expect(
		page.getByText(/não pode ser excluído porque está sendo utilizado/i),
	).toBeVisible();
});
