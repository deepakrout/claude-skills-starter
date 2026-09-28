// The pattern the writing-zod-v4-schemas skill teaches, as runnable code.
import { z } from "zod";

export const SignupSchema = z.strictObject({
  email: z.email({ error: "Enter a valid email" }),
  age: z.number({
    error: (iss) => (iss.input === undefined ? "Age is required" : "Age must be a number"),
  }),
  website: z.url().optional(),
  plan: z.enum(["free", "pro"]),
});

const bad = SignupSchema.safeParse({ email: "nope", plan: "gold", extra: true });
console.log(z.prettifyError(bad.error));

const good = SignupSchema.safeParse({ email: "dev@habitualcs.io", age: 34, plan: "pro" });
console.log("\nvalid input parsed:", good.success);
