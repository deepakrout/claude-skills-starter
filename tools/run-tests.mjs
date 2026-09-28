#!/usr/bin/env node
// Validates every skill and checks the checker against the good and drifted fixtures.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

let failed = 0;
const run = (label, args, expectExit) => {
  let code = 0;
  let out = "";
  try {
    out = execFileSync("node", args, { encoding: "utf8" });
  } catch (e) {
    code = e.status;
    out = e.stdout;
  }
  const ok = code === expectExit;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label} (exit ${code}, expected ${expectExit})`);
  if (!ok) console.log(out);
};

for (const s of readdirSync("skills")) {
  run(`validate skills/${s}`, ["tools/validate-skill.mjs", `skills/${s}`], 0);
}
run("checker passes on examples/echo-plugin", ["skills/maintaining-capacitor-plugins/scripts/check_plugin.mjs", "examples/echo-plugin"], 0);
run("checker fails on examples/echo-plugin-drifted", ["skills/maintaining-capacitor-plugins/scripts/check_plugin.mjs", "examples/echo-plugin-drifted"], 1);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
