import { defineConfig, devices } from "@playwright/test";

// E2E contra a aplicação real. Pré-requisito: backend rodando em :8080 (docker-compose up -d
// a partir de /backend), com o seed de desenvolvimento aplicado. O Vite dev é iniciado
// automaticamente pelo `webServer` abaixo.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [["html", { open: "never" }], ["list"]],
	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		// Faz login uma vez e salva o storageState (token + paróquia atual).
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{
			name: "chromium",
			dependencies: ["setup"],
			// Apenas specs .ts (o repositório versiona .js compilados que não devem rodar em dobro).
			testMatch: /\.spec\.ts$/,
			use: {
				...devices["Desktop Chrome"],
				storageState: "e2e/.auth/admin.json",
			},
		},
	],
	webServer: {
		command: "npm run dev",
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
