import { expect, test } from "@playwright/test";
import {
	type EstoqueRoupaItem,
	type PagedResponse,
	criarAlimento,
	entradaEstoque,
	makeApi,
	somaPacotesAlimento,
	somaPecasRoupa,
	totalCestasDisponiveis,
} from "./api";
import { expectToast, pickSearchable, setQuantity } from "./helpers";

// §10 Integração Entregas → Estoque: toda entrega gera baixa automática no controle correspondente.
test.describe("Integração Entrega → Estoque", () => {
	test("entrega de alimentos decrementa o estoque automaticamente", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const nome = `Entrega Feijão E2E ${Date.now()}`;
		const idItem = await criarAlimento(api, nome, "Peso");
		await entradaEstoque(api, {
			idItem,
			tamanhoValor: 1,
			tamanhoUnidade: "kg",
			validade: "2026-12-01",
			lote: "L-E2E-ENT",
			quantidade: 20,
		});
		const antes = await somaPacotesAlimento(api, idItem); // 20

		await page.goto("/entregas");
		await page.getByRole("button", { name: /Nova entrega/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");
		await dialog.getByRole("tab", { name: /Alimentos/i }).click();
		await pickSearchable(dialog, /Selecione o item em estoque/i, new RegExp(nome));
		await setQuantity(dialog.getByRole("spinbutton").first(), "6");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Entrega registrada/i);

		expect(await somaPacotesAlimento(api, idItem)).toBe(antes - 6);
	});

	test("entrega de roupas decrementa o estoque de roupas", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		// Garante saldo: descobre o idItem da camiseta e repõe via API.
		const estoque = await api.get<PagedResponse<EstoqueRoupaItem>>(
			"/estoque/roupas?page=1&pageSize=500",
		);
		const camiseta = estoque.items.find((i) => i.descricao === "Camiseta branca");
		expect(camiseta, "camiseta no seed").toBeTruthy();
		await entradaEstoque(api, { idItem: camiseta!.idItem, quantidade: 5 });
		const antes = await somaPecasRoupa(api, "Camiseta branca");

		await page.goto("/entregas");
		await page.getByRole("button", { name: /Nova entrega/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");
		await dialog.getByRole("tab", { name: /Roupas/i }).click();
		await pickSearchable(
			dialog,
			/Selecione o item em estoque/i,
			/Camiseta branca/,
		);
		await setQuantity(dialog.getByRole("spinbutton").first(), "2");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Entrega registrada/i);

		expect(await somaPecasRoupa(api, "Camiseta branca")).toBe(antes - 2);
	});

	test("entrega de cestas decrementa o controle de cestas", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		// Setup: cria um lote de cestas via doação fechada, para haver saldo.
		const doadores = await api.get<PagedResponse<{ id: number }>>(
			"/doadores?page=1&pageSize=1",
		);
		await api.post("/doacoes/cestas", {
			idDoador: doadores.items[0].id,
			quantidade: 3,
			observacao: "setup-e2e",
		});
		const sel = await api.get<{ idLote: number; label: string; disponivel: number }[]>(
			"/lotes-cesta/select",
		);
		const lote = sel.find((l) => l.disponivel > 0);
		expect(lote, "lote de cesta disponível").toBeTruthy();
		const antes = await totalCestasDisponiveis(api);

		await page.goto("/entregas");
		await page.getByRole("button", { name: /Nova entrega/i }).click();
		const dialog = page.getByRole("dialog");
		await pickSearchable(dialog, /Selecione a família/i, "João dos Santos");
		await pickSearchable(dialog, /Selecione a cesta/i, lote!.label);
		await setQuantity(dialog.getByRole("spinbutton").first(), "1");
		await dialog.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Entrega registrada/i);

		expect(await totalCestasDisponiveis(api)).toBe(antes - 1);
	});
});
