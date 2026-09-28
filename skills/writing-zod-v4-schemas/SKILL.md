---
name: writing-zod-v4-schemas
description: Writes and reviews Zod 4 validation schemas in TypeScript, avoiding Zod 3 APIs that are silently ignored or deprecated in v4. Use when writing or editing Zod schemas, when code imports from "zod", mentions z.object, safeParse or z.infer, or when upgrading a project from Zod 3 to Zod 4.
---

# Writing Zod 4 schemas

This project uses **Zod 4**. Most public Zod code is Zod 3, so the default habit is to
write v3 APIs. Some still work (deprecated); some are **silently ignored** in v4.

## Step 1: confirm the version

```bash
node -p "require('zod/package.json').version"
```

If it prints `3.x`, stop and tell the user this skill targets Zod 4.

## Step 2: never use these (silently ignored in v4, no error thrown)

| Zod 3 param            | What happens in v4                  | Write instead                           |
|------------------------|-------------------------------------|-----------------------------------------|
| `invalid_type_error`   | Dropped; default message is shown   | `error: (iss) => "..."`                 |
| `required_error`       | Dropped; default message is shown   | `error: (iss) => iss.input === undefined ? "Required" : "..."` |
| `errorMap: () => ...`  | Dropped; default message is shown   | `error: (iss) => "..."`                 |

## Step 3: prefer the v4 form over deprecated APIs

| Deprecated (still runs)          | Zod 4 form                                   |
|----------------------------------|----------------------------------------------|
| `z.string().email()` / `.url()` / `.uuid()` | `z.email()` / `z.url()` / `z.uuid()` |
| `{ message: "..." }`             | `{ error: "..." }`                           |
| `A.merge(B)`                     | `A.extend(B.shape)`                          |
| `z.object({...}).strict()`       | `z.strictObject({...})`                      |
| `z.object({...}).passthrough()`  | `z.looseObject({...})`                       |
| `z.nativeEnum(MyEnum)`           | `z.enum(MyEnum)`                             |
| `err.flatten()` / `err.format()` | `z.treeifyError(err)` / `z.prettifyError(err)` |

## Pattern to follow

```ts
import { z } from "zod";

export const SignupSchema = z.strictObject({
  email: z.email({ error: "Enter a valid email" }),
  age: z.number({
    error: (iss) => (iss.input === undefined ? "Age is required" : "Age must be a number"),
  }),
  website: z.url().optional(),
  plan: z.enum(["free", "pro"]),
});

export type Signup = z.infer<typeof SignupSchema>;

const result = SignupSchema.safeParse(input);
if (!result.success) console.error(z.prettifyError(result.error));
```

## Checklist before returning code

- [ ] No `invalid_type_error`, `required_error`, or `errorMap` anywhere
- [ ] No `message:` keys in error params
- [ ] No `.email()` / `.url()` / `.uuid()` chained on `z.string()`
- [ ] No `.merge()`, `.strict()`, `.passthrough()`, `z.nativeEnum`, `.flatten()`
