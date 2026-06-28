import { type Locator, type Page, expect } from "@playwright/test";

// Seleciona um valor num SearchableSelect (combobox: o gatilho é um input de busca;
// as opções são portalizadas para o body, consultadas no nível da página).
export async function pickSearchable(
	scope: Locator | Page,
	triggerName: RegExp | string,
	optionLabel: RegExp | string,
) {
	const page: Page = "page" in scope ? scope.page() : scope;
	const trigger = scope.getByPlaceholder(triggerName).first();
	await trigger.click();
	// Digita a busca no próprio gatilho (input) para filtrar; reduz ambiguidade de opções.
	if (typeof optionLabel === "string") await trigger.fill(optionLabel);
	await page.getByRole("button", { name: optionLabel }).first().click();
}

// Seleciona num Select do shadcn (gatilho role=combobox; opções em portal no nível da página).
export async function pickSelect(
	page: Page,
	trigger: Locator,
	optionName: RegExp | string,
) {
	await trigger.click();
	await page.getByRole("option", { name: optionName }).first().click();
}

// Preenche um QuantityInput (modo count ou medida) e dispara o blur para normalizar/validar.
export async function setQuantity(field: Locator, value: string) {
	await field.fill(value);
	await field.blur();
}

// Abre o DatePicker e seleciona um dia do mês visível (padrão dia 15, sempre presente).
// Os botões de dia têm aria-label com a data completa, então localizamos pelo texto visível
// dentro da grade do calendário.
export async function pickDate(page: Page, trigger: Locator, day = "15") {
	await trigger.click();
	await page
		.getByTestId("datepicker-content")
		.getByText(day, { exact: true })
		.first()
		.click();
}

// Espera um toast de sucesso/erro com o texto informado e então some.
export async function expectToast(page: Page, text: RegExp | string) {
	await expect(page.getByText(text).first()).toBeVisible();
}

// Abre o módulo de Estoque e seleciona uma aba (Alimentos | Roupas | Gêneros | Histórico).
export async function gotoEstoque(
	page: Page,
	aba: "Alimentos" | "Roupas" | "Gêneros" | "Histórico",
) {
	await page.goto("/estoque");
	await page.getByRole("tab", { name: aba }).click();
}
