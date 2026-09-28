# claude-skills-starter

Two working [Agent Skills](https://agentskills.io) for Claude, plus the tooling to validate,
measure and package your own. Companion repo for the habitualcs.io tutorial
**"Build AI Skills for Any SDK, Package or Framework — A Claude Skills Deep Dive"**.

| Skill | Level | What it teaches Claude |
|---|---|---|
| [`writing-zod-v4-schemas`](skills/writing-zod-v4-schemas/SKILL.md) | Simple (one file) | Write Zod 4 schemas without the Zod 3 habits that v4 silently ignores |
| [`maintaining-capacitor-plugins`](skills/maintaining-capacitor-plugins/SKILL.md) | Intermediate → advanced | Keep a Capacitor 8 plugin's package.json, podspec, Package.swift and build.gradle in sync, enforced by a checker script |

## Repo layout

```
claude-skills-starter/
├── skills/
│   ├── writing-zod-v4-schemas/
│   │   └── SKILL.md
│   └── maintaining-capacitor-plugins/
│       ├── SKILL.md                    # workflow + tables (loaded on trigger)
│       ├── reference/                  # loaded only when needed
│       │   ├── podspec.md
│       │   ├── spm.md
│       │   └── android.md
│       └── scripts/
│           └── check_plugin.mjs        # executed, never loaded into context
├── examples/
│   ├── zod-demo/                       # probe that proves which Zod 3 habits break
│   ├── echo-plugin/                    # healthy Capacitor 8 plugin (checker: PASS)
│   └── echo-plugin-drifted/            # half-upgraded plugin (checker: 7 problems)
├── evals/                              # 3 eval scenarios per skill
├── tools/
│   ├── validate-skill.mjs              # lint frontmatter, links, paths, size
│   ├── token-budget.mjs                # context cost per disclosure level
│   ├── package-skill.sh                # zip for claude.ai upload
│   └── run-tests.mjs
└── .github/workflows/validate-skills.yml
```

## Setup

Requires Node 20+. No dependencies at the root.

```bash
git clone https://github.com/deepakrout/claude-skills-starter.git
cd claude-skills-starter
npm test            # validates both skills, runs the checker on both fixtures
npm run budget      # token cost table
```

Try the evidence behind the Zod skill:

```bash
cd examples/zod-demo
npm install
npm run probe       # shows invalid_type_error / required_error / errorMap being ignored
npm run signup      # the v4 pattern the skill teaches
```

Try the Capacitor checker:

```bash
npm run check:plugin -- examples/echo-plugin          # PASS
npm run check:plugin -- examples/echo-plugin-drifted  # FAIL, 7 problems
```

## Install the skills

### Claude Code

```bash
# personal (all projects)
cp -r skills/writing-zod-v4-schemas ~/.claude/skills/

# or project-scoped (commit it with the repo)
mkdir -p .claude/skills && cp -r skills/maintaining-capacitor-plugins .claude/skills/
```

Claude Code picks up changes live. Invoke directly with `/writing-zod-v4-schemas`, or just ask
a Zod question and let the description trigger it.

### Claude apps (claude.ai / desktop)

```bash
npm run package -- skills/writing-zod-v4-schemas   # creates dist/writing-zod-v4-schemas.zip
```

Upload the zip in **Settings → Capabilities → Skills**. Code execution must be enabled.

### Claude API

```python
import anthropic
from anthropic.lib import files_from_dir

client = anthropic.Anthropic()
skill = client.skills.create(files=files_from_dir("skills/writing-zod-v4-schemas"))

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    container={"skills": [{"type": "custom", "skill_id": skill.id, "version": "latest"}]},
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    messages=[{"role": "user", "content": "Write a Zod schema for a signup form."}],
)
```

## Validate your own skill

```bash
node tools/validate-skill.mjs path/to/my-skill --target=claude-ai
```

Checks: `name` ≤ 64 chars, lowercase/hyphen only, no reserved words (`claude`, `anthropic`);
`description` present, ≤ 1,024 chars, no angle brackets, third person, has a "Use when" trigger;
body under 500 lines; linked `.md` files exist and are one level deep; forward-slash paths;
folder under 30 MB.

## License

MIT
