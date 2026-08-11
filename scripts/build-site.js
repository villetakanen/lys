/**
 * Assembles the site/ directory for GitHub Pages deployment.
 *
 * Copies examples (with rewritten asset paths) and llms.txt into site/,
 * alongside the dist assets they need. Run after `vite build`.
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const site = resolve(root, "site");
const examplesOut = resolve(site, "examples");

// 1. Copy llms.txt into site/
cpSync(resolve(root, "llms.txt"), resolve(site, "llms.txt"));

// 2. Copy dist assets into site/examples/
mkdirSync(examplesOut, { recursive: true });
cpSync(resolve(root, "dist/lys.css"), resolve(examplesOut, "lys.css"));
cpSync(resolve(root, "dist/lys.iife.js"), resolve(examplesOut, "lys.iife.js"));
// The ESM build too: decks that `import { Lys }` need real exports (see below).
cpSync(resolve(root, "dist/lys.js"), resolve(examplesOut, "lys.js"));

// 3. Copy and rewrite example HTML files
const examplesSrc = resolve(root, "examples");
for (const file of readdirSync(examplesSrc)) {
	if (!file.endsWith(".html")) continue;

	let html = readFileSync(resolve(examplesSrc, file), "utf8");
	html = html.replaceAll("/src/lys.css", "lys.css");
	// Decks load Lys one of two ways, and they need different builds.
	// 1. <script type="module" src="/src/lys.ts"> — swap in the auto-initializing
	//    IIFE and drop type="module" (it is not a module).
	html = html.replaceAll('type="module" src="/src/lys.ts"', 'src="lys.iife.js"');
	// 2. `import { Lys } from "/src/lys.ts"` — needs the ESM build. Pointing this
	//    at the IIFE produced a bare specifier the browser cannot resolve, and the
	//    IIFE exports nothing anyway, so demo.html and full.html shipped to the
	//    site with no JS at all: no keyboard nav, no ARIA, no data-class.
	html = html.replaceAll("/src/lys.ts", "./lys.js");
	writeFileSync(resolve(examplesOut, file), html);
}

console.log(
	`✓ Site assembled: llms.txt + ${readdirSync(examplesOut).length} files in site/examples/`,
);
