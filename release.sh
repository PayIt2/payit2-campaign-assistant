#!/bin/bash
# Release the Campaign Assistant and open pin-bump PRs in both marketplaces.
#
#  1. payit2-campaign-assistant: main must already carry the release through a merged PR
#     (plugin.json version, a "## [X.Y.Z]" CHANGELOG heading, the rebuilt zip). This script
#     tags that commit and creates the GitHub release; the release workflow attaches the zip.
#  2. payit2-plugins-marketplace (public) and payit2-team-plugins (private): on the day's
#     release/YYYY-MM-DD branch, bump the git-subdir sha pointer and open (or update) a
#     draft PR. Nothing is pushed to main (PLATFORM-STANDARDS §15).
#
# Usage:
#   ./release.sh <version> "<release title>" ["<release notes>"]
#   DRY_RUN=1 ./release.sh v1.7.0 "v1.7.0 - Connector"   # checks and prints, changes nothing

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
MARKETPLACES=("$REPO_DIR/../payit2-plugins-marketplace" "$REPO_DIR/../payit2-team-plugins")
PLUGIN_NAME="payit2-campaign-assistant"
DRY_RUN="${DRY_RUN:-}"

VERSION="${1:-}"
TITLE="${2:-}"
NOTES="${3:-Plugin zip attached. See CHANGELOG.md for details.}"

die() { echo "Error: $*" >&2; exit 1; }
run() { if [[ -n "$DRY_RUN" ]]; then echo "    [dry run] $*"; else "$@"; fi; }

[[ -n "$VERSION" && -n "$TITLE" ]] || die "usage: ./release.sh <version> \"<title>\" [\"<notes>\"]"
[[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "version must look like vX.Y.Z (got $VERSION)"
SEMVER="${VERSION#v}"
BRANCH="release/$(date +%Y-%m-%d)"

# ---------- Plugin repo: check main, then tag it ----------

cd "$REPO_DIR"
git fetch origin main --quiet
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || die "run this from main after the release PR has merged"
git diff --quiet && git diff --cached --quiet || die "the plugin repo has uncommitted changes"
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || die "local main is not origin/main; run git pull --ff-only"
MANIFEST_VERSION="$(python3 -c 'import json; print(json.load(open("plugin/.claude-plugin/plugin.json"))["version"])')"
[[ "$MANIFEST_VERSION" == "$SEMVER" ]] || die "plugin.json says $MANIFEST_VERSION, not $SEMVER; land the version bump through a PR first"
grep -q "^## \[$SEMVER\]" CHANGELOG.md || die "CHANGELOG.md has no '## [$SEMVER]' heading"
git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null && die "tag $VERSION already exists"
for dir in "${MARKETPLACES[@]}"; do [[ -d "$dir/.git" ]] || die "marketplace repo not found at $dir"; done

PLUGIN_SHA="$(git rev-parse HEAD)"
echo "==> Releasing $VERSION at $PLUGIN_SHA"
run gh release create "$VERSION" --target "$PLUGIN_SHA" --title "$TITLE" --notes "$NOTES"

# ---------- Marketplaces: bump the pin on a release branch, open a draft PR ----------

for dir in "${MARKETPLACES[@]}"; do
  cd "$dir"
  name="$(basename "$dir")"
  echo ""
  echo "==> $name"
  git diff --quiet && git diff --cached --quiet || die "$name has uncommitted changes"
  git fetch origin --quiet
  default="$(git symbolic-ref --short refs/remotes/origin/HEAD | sed 's#^origin/##')"
  if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    run git switch "$BRANCH"
    run git pull --ff-only
  else
    run git switch -c "$BRANCH" "origin/$default"
    run git branch --unset-upstream
  fi
  if [[ -n "$DRY_RUN" ]]; then
    echo "    [dry run] set $PLUGIN_NAME sha to $PLUGIN_SHA in .claude-plugin/marketplace.json"
    continue
  fi
  python3 - "$PLUGIN_SHA" "$PLUGIN_NAME" <<'PY'
import json, sys
sha, name = sys.argv[1], sys.argv[2]
path = ".claude-plugin/marketplace.json"
data = json.load(open(path))
for plugin in data.get("plugins", []):
    if plugin.get("name") == name:
        plugin["source"]["sha"] = sha
        break
else:
    sys.exit(f"{name} entry not found in {path}")
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY
  git add .claude-plugin/marketplace.json
  if git diff --cached --quiet; then
    echo "    pin already at $PLUGIN_SHA"
  else
    git commit -q -m "release: bump $PLUGIN_NAME pointer to $VERSION

Pins the git-subdir source to $PLUGIN_SHA, the $VERSION release commit on
payit2-campaign-assistant."
  fi
  git push -u origin "$BRANCH"
  if gh pr view "$BRANCH" --json state -q .state 2>/dev/null | grep -q OPEN; then
    echo "    updated the open PR for $BRANCH"
  else
    gh pr create --draft --base "$default" --head "$BRANCH" \
      --title "release: bump $PLUGIN_NAME pointer to $VERSION" \
      --body "Pins \`$PLUGIN_NAME\` to \`$PLUGIN_SHA\`, the [$VERSION release](https://github.com/PayIt2/payit2-campaign-assistant/releases/tag/$VERSION).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  fi
done

echo ""
echo "Done. Released $VERSION and opened pin PRs on $BRANCH."
echo "After the public marketplace PR merges, publish its release so the zips rebuild:"
echo "  gh release create $VERSION -R PayIt2/payit2-plugins-marketplace --target main --title \"$TITLE\" --notes \"Pinned $PLUGIN_NAME to $PLUGIN_SHA.\""
