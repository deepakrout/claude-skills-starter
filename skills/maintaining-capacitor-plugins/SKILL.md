---
name: maintaining-capacitor-plugins
description: Creates, upgrades and audits Capacitor 8 plugins across npm (package.json), iOS (podspec and Package.swift) and Android (build.gradle), keeping versions and platform targets in sync. Use when editing a Capacitor plugin, a .podspec, Package.swift or plugin build.gradle, when bumping a plugin version, or when pod install / SPM / Gradle fails for a plugin.
---

# Maintaining Capacitor plugins

A Capacitor plugin ships the same version through three package managers. Most bugs are
**drift**: one manifest changed, the others did not. Never finish a task on a plugin until
the checker passes.

## Workflow

Copy this checklist into your response and tick it off:

```
Plugin task progress:
- [ ] 1. Run the checker to get a baseline
- [ ] 2. Make the requested change
- [ ] 3. Apply the same change to every manifest it touches (see table)
- [ ] 4. Re-run the checker; fix and repeat until it prints PASS
- [ ] 5. Summarise what changed per platform
```

**Step 1 and 4: run the checker** (do not read its source, just run it):

```bash
node ${CLAUDE_SKILL_DIR}/scripts/check_plugin.mjs <plugin-root>
```

Outside Claude Code, use the path of this skill folder instead of `${CLAUDE_SKILL_DIR}`.
The script exits 0 and prints `PASS` when all manifests agree. Otherwise it prints one
line per problem with the file, the found value and the expected value.

## Which files a change touches

| Change                    | package.json | *.podspec | Package.swift | android/build.gradle |
|---------------------------|:-:|:-:|:-:|:-:|
| Version bump              | ✓ | only if version is hard-coded | – | – |
| iOS minimum               | – | ✓ | ✓ | – |
| Android minSdk/compileSdk | – | – | – | ✓ |
| Capacitor major upgrade   | ✓ | ✓ | ✓ | ✓ |
| New native source folder  | `files` array | `source_files` | `path:` | – |

## Target values (Capacitor 8)

| Setting                         | Value          |
|---------------------------------|----------------|
| iOS deployment target           | `15.0`         |
| `Package.swift` platforms       | `.iOS(.v15)`   |
| Capacitor SPM dependency        | `from: "8.0.0"`|
| Android `minSdkVersion`         | `24`           |
| Android `compileSdk`/`targetSdk`| `36`           |
| `@capacitor/core` peer range    | `>=8.0.0`      |

## Details, loaded only when needed

- Podspec fields and the `package.json`-driven version pattern: [reference/podspec.md](reference/podspec.md)
- Swift Package Manager (`Package.swift`) layout: [reference/spm.md](reference/spm.md)
- Android Gradle settings and the Kotlin `compilerOptions` change: [reference/android.md](reference/android.md)

## Rules

- Keep the podspec version dynamic: `s.version = package['version']`. Do not hard-code it.
- Every file the native build needs must be listed in `package.json` `files`, or the
  published npm tarball will not contain it. The checker enforces this.
- Use forward slashes in every path you write.
