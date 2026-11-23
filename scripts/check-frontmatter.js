// Warn about tracked Markdown/MDX files without OKF `generated` front matter.
// Advisory only: always exits 0. See .agents/skills/markdown-writer/SKILL.md.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z", "--", "*.md", "*.mdx"], { encoding: "utf8" })
	.split("\0")
	.filter(Boolean)
	.filter((file) => !lstatSync(file).isSymbolicLink());

function hasGenerated(text) {
	const lines = text.split(/\r?\n/);
	if (lines[0] !== "---") return false;
	const end = lines.indexOf("---", 1);
	if (end === -1) return false;
	return lines.slice(1, end).some((line) => /^generated:/.test(line));
}

const missing = files.filter((file) => !hasGenerated(readFileSync(file, "utf8")));

if (missing.length > 0) {
	for (const file of missing) console.warn(`warning: no generated front matter: ${file}`);
	console.warn(
		`${missing.length} of ${files.length} Markdown/MDX files lack generated front matter (advisory)`,
	);
}
