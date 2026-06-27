import { expect, test } from "@playwright/test";
import {
	type PagedResponse,
	criarAlimento,
	entradaEstoque,
	makeApi,
} from "./api";
import { gotoEstoque } from "./helpers";

// §1.1/§1.3 visualização do estoque · §4.2/§5.2/§6.2/§7.2 históricos consistentes após recarregar.
test.describe("Histórico, visualização e persistência", () => {
	test("estoque de alimentos exibe o lote (qtd/validade) e persiste após reload", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const nome = `Visu E2E ${Date.now()}`;
		const idItem = await criarAlimento(api, nome, "Peso");
		await entradaEstoque(api, {
			idItem,
			tamanhoValor: 1,
			tamanhoUnidade: "kg",
			validade: "2026-12-31",
			lote: "L-VISU",
			quantidade: 7,
		});

		await gotoEstoque(page, "Alimentos");
		await page.getByPlaceholder(/Buscar por nome ou lote/i).fill(nome);
		const row = page.getByRole("row", { name: new RegExp(nome) });
		await expect(row).toBeVisible();
		await expect(row).toContainText("L-VISU");
		await expect(row).toContainText("7");
		await expect(row).toContainText("31/12/2026");
		// Resumo por alimento reflete o gênero.
		await expect(page.getByText(nome).first()).toBeVisible();

		// Persiste após recarregar a página.
		await page.reload();
		await page.getByPlaceholder(/Buscar por nome ou lote/i).fill(nome);
		await expect(page.getByRole("row", { name: new RegExp(nome) })).toBeVisible();
	});

	test("histórico de doações permanece consistente após reload", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const idItem = await criarAlimento(api, `Hist Doação ${Date.now()}`, "Peso");
		const doadores = await api.get<PagedResponse<{ id: number }>>(
			"/doadores?page=1&pageSize=1",
		);
		await api.post("/doacoes", {
			idDoador: doadores.items[0].id,
			itens: [
				{ idItem, quantidade: 3, tamanhoValor: 1, tamanhoUnidade: "kg" },
			],
		});

		await page.goto("/doacoes");
		await expect(page.getByRole("table")).toBeVisible();
		const linhas = await page.getByRole("row").count();
		expect(linhas).toBeGreaterThan(1);
		await page.reload();
		await expect(page.getByRole("row")).toHaveCount(linhas);
	});

	test("histórico de entregas permanece consistente após reload", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const idItem = await criarAlimento(api, `Hist Entrega ${Date.now()}`, "Peso");
		await entradaEstoque(api, {
			idItem,
			tamanhoValor: 1,
			tamanhoUnidade: "kg",
			validade: "2026-11-30",
			lote: "L-HE",
			quantidade: 5,
		});
		const familias = await api.get<{ value: number }[]>("/familias/select");
		await api.post("/entregas", {
			idFamilia: familias[0].value,
			cestas: [],
			itens: [
				{
					idItem,
					quantidade: 2,
					tamanhoValor: 1,
					tamanhoUnidade: "kg",
					validade: "2026-11-30",
					lote: "L-HE",
				},
			],
		});

		await page.goto("/entregas");
		await expect(page.getByRole("table")).toBeVisible();
		const linhas = await page.getByRole("row").count();
		expect(linhas).toBeGreaterThan(1);
		await page.reload();
		await expect(page.getByRole("row")).toHaveCount(linhas);
	});

	test("controle de cestas exibe lotes e permanece consistente após reload", async ({
		page,
		request,
	}) => {
		const api = await makeApi(request);
		const doadores = await api.get<PagedResponse<{ id: number }>>(
			"/doadores?page=1&pageSize=1",
		);
		await api.post("/doacoes/cestas", {
			idDoador: doadores.items[0].id,
			quantidade: 2,
			observacao: "hist-cesta",
		});

		await page.goto("/cesta-basica");
		await expect(page.getByRole("table")).toBeVisible();
		const linhas = await page.getByRole("row").count();
		expect(linhas).toBeGreaterThan(1);
		await page.reload();
		await expect(page.getByRole("row")).toHaveCount(linhas);
	});
});
