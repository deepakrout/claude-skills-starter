#!/usr/bin/env node
// Lints a skill folder against the Agent Skills / Claude rules before you upload it.
// Usage: node tools/validate-skill.mjs skills/<skill-folder> [--target=claude-ai|claude-code|api]
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const dir = process.argv[2];
const target = (process.argv.find((a) => a.startsWith("--target=")) ?? "--target=claude-ai").split("=")[1];
if (!dir) {
  console.error("Usage: node tools/validate-skill.mjs <skill-folder> [--target=claude-ai|claude-code|api]");
  process.exit(2);
}

const errors = [];
const warnings = [];
const skillPath = join(dir, "SKILL.md");
if (!existsSync(skillPath)) {
  console.error(`${dir}: no SKILL.md (the file name is case-sensitive)`);
  process.exit(1);
}
const raw = readFileSync(skillPath, "utf8");
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
if (!fm) {
  console.error(`${skillPath}: frontmatter must start on line 1 with --- and close with ---`);
  process.exit(1);
}
const [, yaml, body] = fm;
const field = (k) => {
  const m = yaml.match(new RegExp(`^${k}:\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
};
const name = field("name");
const description = field("description");

// name: required for claude.ai / API; defaults to folder name in Claude Code
if (!name) {
  (target === "claude-code" ? warnings : errors).push("name is missing");
} else {
  if (name.length > 64) errors.push(`name is ${name.length} chars (max 64)`);
  if (!/^[a-z0-9-]+$/.test(name)) errors.push(`name "${name}" must be lowercase letters, numbers and hyphens only`);
  if (/anthropic|claude/.test(name)) errors.push(`name "${name}" contains a reserved word ("anthropic" or "claude")`);
  if (name !== basename(dir)) warnings.push(`name "${name}" differs from folder "${basename(dir)}"`);
}

// description
if (!description) errors.push("description is missing or empty");
else {
  if (description.length > 1024) errors.push(`description is ${description.length} chars (max 1024)`);
  if (/<[^>]+>/.test(description)) errors.push("description contains an XML/HTML tag (angle brackets are rejected)");
  if (/\b(I can|I will|you can|You can)\b/.test(description)) warnings.push("description should be third person (\"Processes X...\"), not I/you");
  if (!/\buse (when|for)\b/i.test(description)) warnings.push('description has no trigger clause (add "Use when ...")');
  if (description.length < 80) warnings.push(`description is only ${description.length} chars; it is the only thing Claude sees before loading the skill`);
}

// body
const lines = body.split("\n").length;
if (lines > 500) warnings.push(`SKILL.md body is ${lines} lines (keep under 500; move detail into reference files)`);
if (/\\[A-Za-z_]+\.(md|py|mjs|js|sh)/.test(body)) errors.push("Windows-style backslash path in body; use forward slashes");

// linked files: must exist, and must not link further (one level deep)
for (const [, link] of body.matchAll(/\]\(([^)#\s]+\.md)\)/g)) {
  const p = join(dir, link);
  if (!existsSync(p)) {
    errors.push(`links to ${link}, which does not exist`);
    continue;
  }
  const nested = [...readFileSync(p, "utf8").matchAll(/\]\(([^)#\s]+\.md)\)/g)];
  if (nested.length) warnings.push(`${link} links to ${nested.map((n) => n[1]).join(", ")}; keep references one level deep`);
}

// size (claude.ai / API upload limit is 30 MB uncompressed)
const walk = (d) => readdirSync(d).reduce((s, f) => {
  const p = join(d, f);
  return s + (statSync(p).isDirectory() ? walk(p) : statSync(p).size);
}, 0);
const bytes = walk(dir);
if (bytes > 30 * 1024 * 1024) errors.push(`folder is ${(bytes / 1048576).toFixed(1)} MB (max 30 MB)`);

const label = `${basename(dir)} [${target}]`;
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
console.log(errors.length ? `✗ ${label}: ${errors.length} error(s)` : `✓ ${label}: valid${warnings.length ? ` with ${warnings.length} warning(s)` : ""}`);
process.exit(errors.length ? 1 : 0);
