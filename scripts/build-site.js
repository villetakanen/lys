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

// 3. Copy and rewrite example HTML files
const examplesSrc = resolve(root, "examples");
for (const file of readdirSync(examplesSrc)) {
	if (!file.endsWith(".html")) continue;

	let html = readFileSync(resolve(examplesSrc, file), "utf8");
	html = html.replaceAll("/src/lys.css", "lys.css");
	html = html.replaceAll("/src/lys.ts", "lys.iife.js");
	html = html.replaceAll('type="module" src="lys.iife.js"', 'src="lys.iife.js"');
	writeFileSync(resolve(examplesOut, file), html);
}

console.log(
	`✓ Site assembled: llms.txt + ${readdirSync(examplesOut).length} files in site/examples/`,
);
