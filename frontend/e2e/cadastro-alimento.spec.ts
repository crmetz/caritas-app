import { expect, test } from "@playwright/test";
import { type PagedResponse, alimentoIdPorDescricao, makeApi } from "./api";
import { expectToast, gotoEstoque, pickSelect } from "./helpers";

// §3 Cadastro de Alimentos · §7.1 alimento disponível para uso em todo o sistema.
test.describe("Cadastro de Alimentos", () => {
	test("cria alimento, persiste a unidade e aparece na listagem após reload", async ({
		page,
		request,
	}) => {
		const nome = `Lentilha E2E ${Date.now()}`;
		await gotoEstoque(page, "Gêneros");
		await page.getByRole("button", { name: /Novo alimento/i }).click();

		const dialog = page.getByRole("dialog");
		await dialog.locator("#descricao").fill(nome);
		await pickSelect(page, dialog.locator("#forma"), "Volume");
		await dialog.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Alimento cadastrado/i);

		// Aparece na listagem (busca server-side) e continua lá após recarregar (persistência).
		await page.getByPlaceholder(/Buscar por nome/i).fill(nome);
		await expect(page.getByRole("row", { name: new RegExp(nome) })).toBeVisible();
		await page.reload();
		// O reload volta para a aba padrão; reabrir "Gêneros" e buscar de novo.
		await page.getByRole("tab", { name: "Gêneros" }).click();
		await page.getByPlaceholder(/Buscar por nome/i).fill(nome);
		await expect(page.getByRole("row", { name: new RegExp(nome) })).toBeVisible();

		// A unidade de medida foi persistida corretamente (conferência via API).
		const api = await makeApi(request);
		const lista = await api.get<
			PagedResponse<{ id: number; descricao: string; formaMedida: string }>
		>(`/itens/alimentos?busca=${encodeURIComponent(nome)}`);
		const criado = lista.items.find((a) => a.descricao === nome);
		expect(criado?.formaMedida).toBe("Volume");
	});

	test("alimento recém-criado fica disponível para seleção no estoque", async ({
		page,
		request,
	}) => {
		const nome = `Quinoa E2E ${Date.now()}`;
		const api = await makeApi(request);
		// Cria o alimento (setup) e confirma que ele existe no catálogo.
		await api.post("/itens/alimentos", { descricao: nome, formaMedida: "Peso" });
		expect(await alimentoIdPorDescricao(api, nome)).toBeTruthy();

		// Na tela de estoque, o gênero aparece no seletor de entrada.
		await gotoEstoque(page, "Alimentos");
		await page.getByRole("button", { name: /Adicionar item/i }).click();
		const dialog = page.getByRole("dialog");
		const genero = dialog.getByPlaceholder(/Selecione o gênero/i);
		await genero.click();
		await genero.fill(nome);
		await expect(
			page.getByRole("button", { name: new RegExp(nome) }),
		).toBeVisible();
	});
});
