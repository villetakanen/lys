// @vitest-environment node

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const skill = readFileSync(join(root, "skill/SKILL.md"), "utf8");

function frontmatter(content: string): string {
	const match = content.match(/^---\n([\s\S]*?)\n---\n/);
	expect(match, "SKILL.md must start with YAML frontmatter").not.toBeNull();
	return match?.[1] ?? "";
}

describe("authoring skill discovery metadata", () => {
	it("has a name and useful single-line discovery description", () => {
		const metadata = frontmatter(skill);
		expect(metadata).toMatch(/^name: lys$/m);
		const description = metadata.match(/^description: (\S[^\n]*)$/m)?.[1];
		expect(description).toBeDefined();
		expect(description).toMatch(/presentations/);
		expect(description).toMatch(/Use when/);
		// Plain YAML scalars cannot contain a mapping separator or comment.
		expect(description).not.toMatch(/: |\s#/);
	});

	it("preserves metadata when the build script injects fresh assets", () => {
		const fixture = mkdtempSync(join(tmpdir(), "lys-skill-"));
		try {
			for (const directory of ["scripts", "skill", "dist"]) {
				mkdirSync(join(fixture, directory));
			}
			writeFileSync(join(fixture, "package.json"), '{"type":"module"}');
			copyFileSync(join(root, "scripts/inject-skill.js"), join(fixture, "scripts/inject-skill.js"));
			writeFileSync(join(fixture, "skill/SKILL.md"), skill);
			writeFileSync(
				join(fixture, "llms.txt"),
				"<!-- LYS:SIZES -->\nold sizes\n<!-- /LYS:SIZES -->",
			);
			const css = "/* fresh build */ article { display: block; }";
			const js = 'console.log("fresh build");';
			writeFileSync(join(fixture, "dist/lys.css"), css);
			writeFileSync(join(fixture, "dist/lys.iife.js"), js);

			execFileSync(process.execPath, [join(fixture, "scripts/inject-skill.js")]);

			const delivered = readFileSync(join(fixture, "skill/SKILL.md"), "utf8");
			expect(frontmatter(delivered)).toBe(frontmatter(skill));
			expect(delivered).toContain(`<!-- LYS:CSS -->\n${css}\n<!-- /LYS:CSS -->`);
			expect(delivered).toContain(`<!-- LYS:JS -->\n${js}\n<!-- /LYS:JS -->`);
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});
});
