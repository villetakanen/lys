/**
 * Post-build script: injects dist/ contents into skill/SKILL.md and
 * updates file sizes in llms.txt.
 *
 * Run automatically via `pnpm build`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(fileURLToPath(import.meta.url), "../..");

const css = readFileSync(resolve(root, "dist/lys.css"), "utf8");
const js = readFileSync(resolve(root, "dist/lys.iife.js"), "utf8");

// --- Inject CSS+JS into SKILL.md ---

const skillPath = resolve(root, "skill/SKILL.md");
let skill = readFileSync(skillPath, "utf8");

function inject(content, openTag, closeTag, payload) {
	const re = new RegExp(`(${escapeRegExp(openTag)})\\n[\\s\\S]*?(${escapeRegExp(closeTag)})`);
	const match = content.match(re);
	if (!match) {
		throw new Error(`Marker ${openTag} not found`);
	}
	return content.replace(re, `$1\n${payload}\n$2`);
}

function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

skill = inject(skill, "<!-- LYS:CSS -->", "<!-- /LYS:CSS -->", css.trimEnd());
skill = inject(skill, "<!-- LYS:JS -->", "<!-- /LYS:JS -->", js.trimEnd());

writeFileSync(skillPath, skill);

// --- Update sizes in llms.txt ---

function formatKB(bytes) {
	return (bytes / 1024).toFixed(1);
}

const cssRaw = Buffer.byteLength(css);
const jsRaw = Buffer.byteLength(js);
const cssGzip = gzipSync(css).length;
const jsGzip = gzipSync(js).length;

const sizesTable = `| File | Raw | Gzip |
|---|---|---|
| \`lys.css\` | ${formatKB(cssRaw)} KB | ${formatKB(cssGzip)} KB |
| \`lys.iife.js\` | ${formatKB(jsRaw)} KB | ${formatKB(jsGzip)} KB |`;

const llmsPath = resolve(root, "llms.txt");
let llms = readFileSync(llmsPath, "utf8");
llms = inject(llms, "<!-- LYS:SIZES -->", "<!-- /LYS:SIZES -->", sizesTable);
writeFileSync(llmsPath, llms);

console.log(
	`✓ Injected lys.css (${formatKB(cssRaw)} KB) + lys.iife.js (${formatKB(jsRaw)} KB) into skill/SKILL.md`,
);
console.log(`✓ Updated file sizes in llms.txt`);
