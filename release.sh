#!/bin/bash
# Release the Campaign Assistant and open pin-bump PRs in both marketplaces.
#
#  1. payit2-campaign-assistant: main must already carry the release through a merged PR
#     (plugin.json version, a "## [X.Y.Z]" CHANGELOG heading, the rebuilt zip). This script
#     tags that commit and creates the GitHub release; the release workflow attaches the zip.
#     Safe to rerun: a release that already sits at that commit is kept, and only the PR steps run.
#     Every marketplace is checked (preflight) before the release is created.
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

# Prints the commit a tag points at on origin (the peeled commit for an annotated tag),
# or nothing when origin has no such tag. Fails only when origin cannot be reached.
remote_tag_sha() {
  local out
  out="$(git ls-remote --tags origin "refs/tags/$1" "refs/tags/$1^{}")" || return 1
  awk -v t="refs/tags/$1" '$2 == t "^{}" { p = $1 } $2 == t { l = $1 } END { print (p != "" ? p : l) }' <<<"$out"
}

# Prints the default branch name of the repo at $1, trying origin/HEAD, then
# `git remote set-head origin --auto`, then `gh repo view`. Fails if all three fail.
resolve_default_branch() {
  local dir="$1" ref=""
  ref="$(git -C "$dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)" || ref=""
  if [[ -z "$ref" ]]; then
    git -C "$dir" remote set-head origin --auto >/dev/null 2>&1 || true
    ref="$(git -C "$dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)" || ref=""
  fi
  if [[ -z "$ref" ]]; then
    ref="$(cd "$dir" && gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null)" || ref=""
  fi
  [[ -n "$ref" ]] || return 1
  echo "${ref#origin/}"
}

# Runs every check that can fail for the marketplace repo at $1, so nothing irreversible
# happens first. Prints the repo's default branch on stdout. Uses explicit `|| die` because
# command substitution does not inherit set -e.
preflight_marketplace() {
  local dir="$1" name top default
  name="$(basename "$dir")"
  git -C "$dir" rev-parse --git-dir >/dev/null 2>&1 || die "marketplace repo not found at $dir"
  top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || die "$dir has no work tree"
  [[ "$top" == "$(cd "$dir" && pwd -P)" ]] || die "$dir is not the root of its own git repo (found $top)"
  { git -C "$dir" diff --quiet && git -C "$dir" diff --cached --quiet; } || die "$name has uncommitted changes"
  git -C "$dir" fetch origin --prune --quiet || die "could not fetch origin in $name"
  default="$(resolve_default_branch "$dir")" || die "could not work out the default branch of $name (origin/HEAD is unset, remote set-head failed, gh repo view failed)"
  git -C "$dir" rev-parse --verify --quiet "refs/remotes/origin/$default" >/dev/null || die "$name has no origin/$default after fetching"
  git -C "$dir" show "origin/$default:.claude-plugin/marketplace.json" 2>/dev/null \
    | python3 -c 'import json, sys; sys.exit(0 if any(p.get("name") == sys.argv[1] for p in json.load(sys.stdin).get("plugins", [])) else 1)' "$PLUGIN_NAME" 2>/dev/null \
    || die "$name has no $PLUGIN_NAME entry in .claude-plugin/marketplace.json on origin/$default"
  echo "$default"
}

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
PLUGIN_SHA="$(git rev-parse HEAD)"

# ---------- Preflight: every marketplace, before anything irreversible ----------

DEFAULT_BRANCHES=()
for dir in "${MARKETPLACES[@]}"; do
  default="$(preflight_marketplace "$dir")" || exit 1
  DEFAULT_BRANCHES+=("$default")
  echo "==> preflight ok: $(basename "$dir") (default branch $default)"
done

# ---------- Release: ask the server, so a rerun after a failed pin step just finishes the PRs ----------

TAG_SHA="$(remote_tag_sha "$VERSION")" || die "could not reach origin to look for tag $VERSION"
if RELEASE_ERR="$(gh release view "$VERSION" --json targetCommitish,tagName 2>&1 >/dev/null)"; then
  RELEASE_SHA="$TAG_SHA"
  [[ -n "$RELEASE_SHA" ]] || RELEASE_SHA="$(gh release view "$VERSION" --json targetCommitish -q .targetCommitish)" || die "could not read the commit of release $VERSION"
  [[ "$RELEASE_SHA" == "$PLUGIN_SHA" ]] || die "release $VERSION already exists but points at $RELEASE_SHA, not $PLUGIN_SHA; use a new version or fix the release by hand"
  echo "release $VERSION already exists at $PLUGIN_SHA; continuing with the pin PRs"
else
  [[ "$RELEASE_ERR" == *"release not found"* ]] || die "could not check for an existing release $VERSION: $RELEASE_ERR"
  [[ -z "$TAG_SHA" || "$TAG_SHA" == "$PLUGIN_SHA" ]] || die "tag $VERSION already exists at $TAG_SHA, not $PLUGIN_SHA; use a new version or fix the tag by hand"
  echo "==> Releasing $VERSION at $PLUGIN_SHA"
  run gh release create "$VERSION" --target "$PLUGIN_SHA" --title "$TITLE" --notes "$NOTES"
fi

# ---------- Marketplaces: bump the pin on a release branch, open a draft PR ----------

for i in "${!MARKETPLACES[@]}"; do
  dir="${MARKETPLACES[$i]}"
  default="${DEFAULT_BRANCHES[$i]}"
  cd "$dir"
  name="$(basename "$dir")"
  echo ""
  echo "==> $name"
  if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    run git switch "$BRANCH"
    run git pull --ff-only
  else
    run git switch --no-track -c "$BRANCH" "origin/$default"
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
