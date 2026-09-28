// Runs common Zod 3 habits under the installed Zod 4 and reports what actually happens.
// This is the evidence behind the "silently ignored" table in the skill.
import { z } from "zod";
import { createRequire } from "node:module";
const { version } = createRequire(import.meta.url)("zod/package.json");

const first = (schema, input) => {
  const r = schema.safeParse(input);
  return r.success ? "(parsed OK)" : r.error.issues[0].message;
};

const rows = [
  ["invalid_type_error: 'must be string'", first(z.string({ invalid_type_error: "must be string" }), 1)],
  ["required_error: 'req!'", first(z.string({ required_error: "req!" }), undefined)],
  ["errorMap: () => ({ message: 'custom' })", first(z.string({ errorMap: () => ({ message: "custom" }) }), 1)],
  ["error: (iss) => ... (v4 way)", first(z.string({ error: (iss) => (iss.input === undefined ? "required" : "must be string") }), 1)],
  ["z.string().email({ message: 'bad' })", first(z.string().email({ message: "bad" }), "x")],
  ["z.email({ error: 'bad' }) (v4 way)", first(z.email({ error: "bad" }), "x")],
  [".strict() rejects unknown keys", first(z.object({ a: z.string() }).strict(), { a: "1", b: 2 })],
  [".merge() still callable", typeof z.object({}).merge],
  ["z.nativeEnum still callable", typeof z.nativeEnum],
];

console.log(`zod ${version}\n`);
for (const [habit, result] of rows) console.log(`${habit.padEnd(44)} → ${result}`);
