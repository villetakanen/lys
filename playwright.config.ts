import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	webServer: [
		{
			command: "pnpm dev",
			port: 5173,
			reuseExistingServer: !process.env.CI,
		},
		{
			// The built site, for assertions that depend on the production cascade.
			// In dev, lys.ts's `import "./lys.css"` makes Vite inject Lys's styles
			// at module-execution time — after the deck's own <style> — so Lys wins
			// declarations the author is supposed to win. The built pages use a
			// <link> ahead of the author styles, which is the real order.
			// Always rebuild: serving a stale site/ would let a broken build pass.
			command: "pnpm build && pnpm exec vite preview --outDir site --port 4173 --strictPort",
			port: 4173,
			reuseExistingServer: false,
			timeout: 120_000,
		},
	],
	use: {
		baseURL: "http://localhost:5173",
	},
	projects: [
		{ name: "chromium", use: { browserName: "chromium" } },
		{ name: "firefox", use: { browserName: "firefox" } },
		{ name: "webkit", use: { browserName: "webkit" } },
	],
});
