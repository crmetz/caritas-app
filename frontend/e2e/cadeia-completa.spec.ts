import { expect, test } from "@playwright/test";
import {
	type LoteCestaItem,
	type PagedResponse,
	alimentoIdPorDescricao,
	makeApi,
	somaPacotesAlimento,
} from "./api";
import {
	expectToast,
	gotoEstoque,
	pickSearchable,
	pickSelect,
	setQuantity,
} from "./helpers";

// Regressão Crítica (§13.3): cadeia ponta-a-ponta exercitada pela UI, com conferência de saldos
// via API em cada etapa. Se este teste falhar, a integração principal do sistema está comprometida.
test("cadeia completa: alimento → doação → estoque → cesta → montagem → entrega → baixa", async ({
	page,
	request,
}) => {
	test.setTimeout(60_000);
	const api = await makeApi(request);
	const sufixo = `${Date.now()}`;
	const nomeAlim = `Cadeia Arroz ${sufixo}`;
	const nomeConfig = `Cadeia Cesta ${sufixo}`;

	// 1. Cadastrar alimento (UI).
	await test.step("cadastra alimento", async () => {
		await gotoEstoque(page, "Gêneros");
		await page.getByRole("button", { name: /Novo alimento/i }).click();
		const d = page.getByRole("dialog");
		await d.locator("#descricao").fill(nomeAlim);
		await pickSelect(page, d.locator("#forma"), "Peso");
		await d.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Alimento cadastrado/i);
	});
	const idItem = await alimentoIdPorDescricao(api, nomeAlim);
	expect(idItem, "alimento criado").toBeTruthy();

	// 2-3. Registrar doação do alimento (UI) → entrada automática no estoque.
	await test.step("doação gera entrada no estoque", async () => {
		await page.goto("/doacoes");
		await page.getByRole("button", { name: /Nova doação/i }).click();
		const d = page.getByRole("dialog");
		await pickSearchable(d, /Selecione um doador/i, "Maria da Silva");
		await pickSearchable(d, /Selecione o item/i, nomeAlim);
		const medida = d.getByPlaceholder(/Ex\.:/i).first();
		await setQuantity(medida, "1kg");
		await expect(medida).toHaveValue("1 kg"); // aguarda a normalização antes da qtd
		await setQuantity(d.getByRole("spinbutton").first(), "6");
		await d.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Doação registrada/i);
	});
	expect(await somaPacotesAlimento(api, idItem!)).toBe(6);

	// 4. Criar configuração de cesta (UI) — 2 pacotes do alimento por cesta.
	await test.step("cria configuração de cesta", async () => {
		await page.goto("/cesta-basica");
		await page.getByRole("tab", { name: /Configurações/i }).click();
		await page.getByRole("button", { name: /Nova configuração/i }).click();
		const d = page.getByRole("dialog");
		await d.locator("#nome").fill(nomeConfig);
		await pickSearchable(d, /Alimento/i, nomeAlim);
		const medida = d.getByPlaceholder(/kg|ml|un/i).first();
		await setQuantity(medida, "1kg");
		await expect(medida).toHaveValue("1 kg");
		await setQuantity(d.getByRole("spinbutton").first(), "2");
		await d.getByRole("button", { name: /^Salvar$/ }).click();
		await expectToast(page, /Configuração criada/i);
	});

	// 5-7. Montar cesta (UI) → consome 2 pacotes, cria a cesta.
	await test.step("monta a cesta", async () => {
		await page.goto("/cesta-basica");
		await page.getByRole("button", { name: /Montar cestas/i }).click();
		const d = page.getByRole("dialog");
		await pickSearchable(d, /Selecione a cesta/i, new RegExp(nomeConfig));
		await setQuantity(d.locator("#qtd-montar"), "1");
		await d.getByRole("button", { name: /Continuar/i }).click();
		await d.getByRole("button", { name: /Confirmar montagem/i }).click();
		await expectToast(page, /cesta\(s\) montada\(s\)/i);
	});
	expect(await somaPacotesAlimento(api, idItem!), "estoque consumido").toBe(4);

	// Localiza o lote recém-montado desta configuração.
	const lotes = await api.get<PagedResponse<LoteCestaItem>>(
		"/lotes-cesta?page=1&pageSize=500",
	);
	const lote = lotes.items.find(
		(l) => l.origem === "Montagem" && l.nomeConfiguracao === nomeConfig,
	);
	expect(lote, "lote montado criado").toBeTruthy();
	expect(lote!.quantidadeDisponivel).toBe(1);

	// 8-9. Registrar entrega da cesta (UI) → baixa automática da cesta.
	await test.step("entrega a cesta", async () => {
		const sel = await api.get<{ idLote: number; label: string }[]>(
			"/lotes-cesta/select",
		);
		const label = sel.find((s) => s.idLote === lote!.id)?.label;
		expect(label, "lote disponível para entrega").toBeTruthy();

		await page.goto("/entregas");
		await page.getByRole("button", { name: /Nova entrega/i }).click();
		const d = page.getByRole("dialog");
		await pickSearchable(d, /Selecione a família/i, "João dos Santos");
		await pickSearchable(d, /Selecione a cesta/i, label!);
		await setQuantity(d.getByRole("spinbutton").first(), "1");
		await d.getByRole("button", { name: /^Registrar$/ }).click();
		await expectToast(page, /Entrega registrada/i);
	});

	// 10. Histórico de entrega exibido.
	await page.goto("/entregas");
	await expect(page.getByRole("table")).toBeVisible();
	await expect(page.getByRole("row").nth(1)).toBeVisible();

	// 11. Consistência final: cesta baixada (saldo 0) e estoque permanece em 4.
	const lotesFim = await api.get<PagedResponse<LoteCestaItem>>(
		"/lotes-cesta?page=1&pageSize=500",
	);
	const loteFim = lotesFim.items.find((l) => l.id === lote!.id);
	expect(loteFim!.quantidadeDisponivel, "cesta entregue baixada").toBe(0);
	expect(await somaPacotesAlimento(api, idItem!), "estoque final estável").toBe(4);
});
