import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/lys.ts"),
			name: "Lys",
			formats: ["es", "iife"],
			fileName: (format) => (format === "es" ? "lys.js" : "lys.iife.js"),
		},
		rollupOptions: {
			output: {
				assetFileNames: "lys.[ext]",
			},
		},
		cssMinify: true,
		// Keep native light-dark(); lowering it to a media query loses color-scheme overrides.
		cssTarget: ["chrome145", "firefox146", "safari26"],
		minify: "oxc",
		target: "es2022",
	},
});
