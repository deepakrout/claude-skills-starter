#!/usr/bin/env bash
# Zips a skill for upload to claude.ai (Settings > Capabilities > Skills).
# The zip must contain the skill FOLDER, with SKILL.md inside it (not SKILL.md at the zip root).
set -euo pipefail
SKILL_DIR="${1:?Usage: tools/package-skill.sh skills/<skill-folder>}"
NAME="$(basename "$SKILL_DIR")"
node "$(dirname "$0")/validate-skill.mjs" "$SKILL_DIR" --target=claude-ai
mkdir -p dist
( cd "$(dirname "$SKILL_DIR")" && zip -qr "$OLDPWD/dist/$NAME.zip" "$NAME" -x '*.DS_Store' )
echo "Created dist/$NAME.zip"
unzip -l "dist/$NAME.zip"
