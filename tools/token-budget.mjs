#!/usr/bin/env node
// Estimates what a skill costs in context at each progressive-disclosure level.
// Level 1 = frontmatter (always loaded), Level 2 = SKILL.md body (on trigger),
// Level 3 = each reference file (only when read). Scripts are executed, not loaded.
// Tokens are estimated at ~4 characters per token (English/code average);
// use the Anthropic token-counting endpoint for exact numbers.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const CHARS_PER_TOKEN = 4;
const est = (s) => Math.ceil(s.length / CHARS_PER_TOKEN);

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error("Usage: node tools/token-budget.mjs <skill-folder> [...more]");
  process.exit(2);
}

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const rows = [];
for (const dir of dirs) {
  const raw = readFileSync(join(dir, "SKILL.md"), "utf8");
  const [, yaml, body] = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const nameDesc = yaml.split("\n").filter((l) => /^(name|description):/.test(l)).join("\n");
  const refs = walk(dir).filter((p) => p.endsWith(".md") && !p.endsWith("SKILL.md"));
  const scripts = walk(dir).filter((p) => /\.(mjs|js|py|sh)$/.test(p));
  const refTokens = refs.reduce((s, p) => s + est(readFileSync(p, "utf8")), 0);
  const scriptTokens = scripts.reduce((s, p) => s + est(readFileSync(p, "utf8")), 0);
  rows.push({
    skill: relative(process.cwd(), dir),
    l1: est(nameDesc),
    l2: est(body),
    l3: refTokens,
    refs: refs.length,
    scripts: scriptTokens,
    all: est(nameDesc) + est(body) + refTokens + scriptTokens,
  });
}

console.log("| Skill | L1 metadata (always) | L2 body (on trigger) | L3 references (on demand) | Scripts (run, not loaded) | If you pasted it all |");
console.log("|---|--:|--:|--:|--:|--:|");
for (const r of rows) {
  console.log(`| ${r.skill} | ${r.l1} | ${r.l2} | ${r.l3} (${r.refs} files) | ${r.scripts} | ${r.all} |`);
}
