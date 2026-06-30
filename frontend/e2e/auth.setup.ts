import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/admin.json";

// Credenciais do admin de seed (Program.cs).
const ADMIN_EMAIL = process.env.E2E_EMAIL ?? "dev@caritas.com";
const ADMIN_PASSWORD = process.env.E2E_PASSWORD ?? "Dev@12345";

setup("authenticate", async ({ page }) => {
	await page.goto("/login");
	await page.locator("#email").fill(ADMIN_EMAIL);
	await page.locator("#password").fill(ADMIN_PASSWORD);
	await page.getByRole("button", { name: /Entrar/i }).click();

	// Após o login o app redireciona para fora do /login e o SessionProvider seleciona a paróquia.
	await page.waitForURL((url) => !url.pathname.startsWith("/login"));
	await expect
		.poll(async () => page.evaluate(() => localStorage.getItem("token")))
		.not.toBeNull();
	await expect
		.poll(async () =>
			page.evaluate(() => localStorage.getItem("paroquiaAtualId")),
		)
		.not.toBeNull();

	await page.context().storageState({ path: AUTH_FILE });
});
