#!/usr/bin/env bash
# Build the ChatGPT (OpenAI) package from the same plugin/ source as the Claude zip.
# Output: $OUT/payit2-chatgpt-plugin/ (staged) and $OUT/payit2-chatgpt-plugin.zip. OUT defaults to dist/.
#
# OpenAI's portable layout (developers.openai.com/plugins/build/plugins, checked 2026-11-08):
# root plugin.json and mcp.json, skills/<name>/SKILL.md, assets/. Plugins with hooks are not
# eligible for the public directory, so hooks/, scripts/ and the agent stay in the Claude zip only.
# The skills are shared; the ChatGPT connection steps and README come from openai/.
set -euo pipefail
cd "$(dirname "$0")"

OUT="${OUT:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGE="$OUT/payit2-chatgpt-plugin"
ZIP="$OUT/payit2-chatgpt-plugin.zip"
rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE/assets"

cp -R plugin/skills "$STAGE/skills"
cp openai/connect.md "$STAGE/skills/campaign-context/references/connect.md"
cp openai/README.md "$STAGE/README.md"
cp plugin/LICENSE "$STAGE/LICENSE"
cp plugin/.claude-plugin/icon.png "$STAGE/assets/icon.png"
find "$STAGE" -name .DS_Store -delete

python3 - "$STAGE" <<'PY'
import json, sys
stage = sys.argv[1]
src = json.load(open("plugin/.claude-plugin/plugin.json"))
manifest = {
    "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    "name": src["name"],
    "version": src["version"],
    "description": src["description"],
    "author": {"name": "PayIt2", "url": "https://www.payit2.com"},
    "homepage": src["homepage"],
    "repository": "https://github.com/PayIt2/payit2-ai-plugin",
    "license": src["license"],
    "keywords": src["keywords"],
    "extensions": {
        "com.openai": {
            "onboardingSkill": "./skills/campaign-context/SKILL.md",
            "interface": {
                "displayName": src["displayName"],
                "shortDescription": "Run your PayIt2 campaigns",
                "longDescription": "Create and run PayIt2 fundraisers, events and group payments from ChatGPT. Build a campaign page from a few details, check how a campaign is doing and what to do next, and draft posts, emails, thank-yous and updates for your participants. Connect your PayIt2 account to work with your own campaigns.",
                "developerName": "PayIt2",
                "websiteURL": src["homepage"],
                "supportURL": "https://www.payit2.com/support",
                "privacyPolicyURL": "https://www.payit2.com/privacy",
                "termsOfServiceURL": "https://www.payit2.com/terms",
                "logo": "./assets/icon.png",
                "composerIcon": "./assets/icon.png",
            },
        }
    },
}
mcp = {
    "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    "mcpServers": {
        "payit2": {
            "type": "streamable-http",
            "url": "https://mcp.payit2.com/mcp",
            "extensions": {"com.openai": {"auth": {"type": "oauth", "client": {"mode": "dcr"}}}},
        }
    },
}
for name, data in (("plugin.json", manifest), ("mcp.json", mcp)):
    with open(f"{stage}/{name}", "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
PY

# Refuse anything OpenAI's format does not take, so a new Claude-only folder cannot leak in.
extra=$(ls -A "$STAGE" | grep -vxE 'plugin.json|mcp.json|skills|assets|README.md|LICENSE' || true)
[ -z "$extra" ] || { echo "Unexpected in the ChatGPT package: $extra" >&2; exit 1; }

(cd "$STAGE" && zip -qr "$ZIP" . -x "*.DS_Store")
echo "Built $ZIP"
