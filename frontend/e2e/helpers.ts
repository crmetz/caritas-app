import { type Locator, type Page, expect } from "@playwright/test";

// Seleciona um valor num SearchableSelect (componente custom: botão-gatilho + busca + opções).
export async function pickSearchable(
	scope: Locator | Page,
	triggerName: RegExp | string,
	optionLabel: RegExp | string,
) {
	await scope.getByRole("button", { name: triggerName }).first().click();
	const busca = scope.getByPlaceholder(/Buscar/i).first();
	await busca.fill(typeof optionLabel === "string" ? optionLabel : "");
	await scope.getByRole("button", { name: optionLabel }).first().click();
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
