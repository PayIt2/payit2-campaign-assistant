---
title: "Team marketplace, business housekeeping and the 1.7.0 release (implementation plan)"
type: reference
doc_status: active
owner: claude-maintained
---
# Team Marketplace and 1.7.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks marked **Brian** are his to do; Claude prepares the exact steps and checks the result.

**Goal:** Give the PayIt2 team a private plugin marketplace that works in Claude Code and the claude.ai organization catalog, register it in the business repo, and release Campaign Assistant 1.7.0 into both marketplaces.

**Architecture:** A new private repo, `PayIt2/payit2-team-plugins`, holds only an index (`.claude-plugin/marketplace.json`) that pins `git-subdir` sources by commit, like the public marketplace. CI validates the index and every public source; `scripts/check-sources.sh` validates private sources with the developer's own credentials before each pin bump. `release.sh` (rewritten in Plan 1) opens pin PRs in both marketplaces.

**Tech Stack:** GitHub (`gh`), git sparse checkout, Claude Code CLI (`claude plugin validate`), Python 3 standard library, bash, GitHub Actions.

**Spec:** `docs/specs/2026-10-27-prod-connector-e2e-team-marketplace-design.md`, Parts C and D. Depends on Plan 1 (`docs/superpowers/plans/2026-10-27-campaign-assistant-1-7-0.md`): Tasks 1 to 4 here can run before PR 1 merges; Task 5 onward needs it merged.

## Global Constraints

- Marketplace name `payit2-team`; repo `PayIt2/payit2-team-plugins`, **private**. The public `PayIt2/payit2-plugins-marketplace` (name `payit2`) stays public and unchanged apart from pin bumps.
- Plugins at launch: `payit2-campaign-assistant` (source `PayIt2/payit2-campaign-assistant`, path `plugin`, ref `main`) and `payit2-brand` (source `PayIt2/payit2-business`, path `plugins/payit2-brand`, ref `master`). Both pinned by `sha`.
- claude.ai sync rules: private marketplace repo, sources in the same GitHub org, `git-subdir` sources, no top-level `bin/` in a plugin, skill descriptions at most 1,024 characters once folded and free of angle brackets, `plugin.json` keys from the manifest reference (enforced by `claude plugin validate --strict`).
- Git (§15, CHG-2 to CHG-4): every change reaches a default branch through a draft PR from a `release/YYYY-MM-DD` branch; if the repo already has an open PR for today's `release/` branch, add to it instead of opening a second one. Conventional commits, **no `Co-Authored-By` trailer**. Thomas gives the merge signal. PR descriptions end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Copy: "Organizer", never "User"; no em dashes or en dashes.
- Workflows: `timeout-minutes`, `concurrency` with `cancel-in-progress: true`, `actions/checkout@v7`, `actions/setup-node@v7`, Claude CLI pinned to `2.1.252` until Plan 1's live run moves to a newer pin.
- Creating the repo, changing GitHub App installations and the claude.ai org settings are outward-facing. Claude asks Brian before Task 1 Step 1 and never performs the admin steps in Tasks 4 and 7.

---

### Task 1: Create the private repo

**Files:** new repository `PayIt2/payit2-team-plugins`, cloned to `~/Source/PayIt2/payit2-team-plugins`

- [ ] **Step 1: Confirm with Brian, then create it**

Ask Brian to confirm the name `payit2-team-plugins` and private visibility. Then:
```bash
gh repo create PayIt2/payit2-team-plugins --private --add-readme \
  --description "Private Claude plugin marketplace for the PayIt2 team"
cd ~/Source/PayIt2 && gh repo clone PayIt2/payit2-team-plugins
```
Expected: `gh repo view PayIt2/payit2-team-plugins --json visibility -q .visibility` prints `PRIVATE`.

- [ ] **Step 2: Start the day's branch**

```bash
cd ~/Source/PayIt2/payit2-team-plugins
git switch -c "release/$(date +%Y-%m-%d)" origin/main && git branch --unset-upstream
git config user.email   # must print brian@payit2.com
```

---

### Task 2: The index and its checks

**Files (in `payit2-team-plugins`):**
- Create: `.claude-plugin/marketplace.json`, `scripts/check_plugin.py`, `scripts/check_marketplace.py`, `scripts/check-sources.sh`, `.github/workflows/validate.yml`
- Test: `scripts/test_checks.py`

**Interfaces:**
- Produces: `python3 scripts/check_plugin.py <plugin dir>…` (exit 1 and one line per problem), `python3 scripts/check_marketplace.py <marketplace.json>`, `scripts/check-sources.sh [--public-only]`.

- [ ] **Step 1: Write the failing test**

`scripts/test_checks.py`:
```python
import json, subprocess, sys, tempfile, unittest
from pathlib import Path

HERE = Path(__file__).parent

def run(script, *args):
    return subprocess.run([sys.executable, str(HERE / script), *map(str, args)], capture_output=True, text=True)

def skill(root, name, frontmatter):
    d = root / "skills" / name
    d.mkdir(parents=True)
    (d / "SKILL.md").write_text(f"---\n{frontmatter}\n---\n# {name}\n")

class CheckPlugin(unittest.TestCase):
    def test_clean_plugin_passes(self):
        with tempfile.TemporaryDirectory() as t:
            skill(Path(t), "a", "name: a\ndescription: Short and clean.")
            self.assertEqual(run("check_plugin.py", t).returncode, 0)

    def test_folded_description_over_limit_fails(self):
        with tempfile.TemporaryDirectory() as t:
            long = "\n".join("  " + "word " * 40 for _ in range(6))
            skill(Path(t), "a", f"name: a\ndescription: >\n{long}")
            r = run("check_plugin.py", t)
            self.assertEqual(r.returncode, 1)
            self.assertIn("characters once folded", r.stdout)

    def test_angle_brackets_and_bin_fail(self):
        with tempfile.TemporaryDirectory() as t:
            skill(Path(t), "a", "name: a\ndescription: Use for <industry> work.")
            (Path(t) / "bin").mkdir()
            r = run("check_plugin.py", t)
            self.assertIn("angle brackets", r.stdout)
            self.assertIn("bin/", r.stdout)

class CheckMarketplace(unittest.TestCase):
    def write(self, t, data):
        p = Path(t) / "m.json"
        p.write_text(json.dumps(data))
        return p

    def entry(self, name):
        return {"name": name, "description": "d",
                "source": {"source": "git-subdir", "url": "PayIt2/x", "path": "plugin", "ref": "main", "sha": "a" * 40}}

    def test_good_index_passes(self):
        with tempfile.TemporaryDirectory() as t:
            p = self.write(t, {"name": "payit2-team", "owner": {"name": "PayIt2"}, "plugins": [self.entry("one")]})
            self.assertEqual(run("check_marketplace.py", p).returncode, 0)

    def test_public_name_duplicates_and_bad_sha_fail(self):
        with tempfile.TemporaryDirectory() as t:
            bad = self.entry("one"); bad["source"]["sha"] = "main"
            p = self.write(t, {"name": "payit2", "owner": {"name": "PayIt2"}, "plugins": [self.entry("one"), bad]})
            r = run("check_marketplace.py", p)
            self.assertEqual(r.returncode, 1)
            for text in ("public marketplace", "duplicate", "40-character"):
                self.assertIn(text, r.stdout)

if __name__ == "__main__":
    unittest.main()
```

Run: `python3 scripts/test_checks.py`
Expected: FAIL (scripts missing).

- [ ] **Step 2: Implement `scripts/check_plugin.py`**

```python
#!/usr/bin/env python3
"""Checks plugin folders against the claude.ai organization sync rules that
`claude plugin validate --strict` does not cover: skill descriptions at most 1,024
characters once folded, no angle brackets in them, and no top-level bin/ folder."""
import re
import sys
from pathlib import Path

MAX = 1024


def description(skill_md: Path) -> str:
    match = re.match(r"^---\n(.*?)\n---\n", skill_md.read_text(encoding="utf-8"), re.S)
    if not match:
        return ""
    lines = match.group(1).split("\n")
    for i, line in enumerate(lines):
        if not line.startswith("description:"):
            continue
        first = line[len("description:"):].strip()
        parts = [] if first in (">", ">-", ">+", "|", "|-", "|+") else [first.strip("\"'")]
        for nxt in lines[i + 1:]:
            if nxt.startswith((" ", "\t")):
                parts.append(nxt.strip())
            elif nxt.strip() == "":
                continue
            else:
                break
        return " ".join(p for p in parts if p)
    return ""


def check(root: Path) -> list[str]:
    problems = []
    if (root / "bin").is_dir():
        problems.append(f"{root}: top-level bin/ is rejected by the claude.ai sync")
    for skill in sorted(root.glob("skills/*/SKILL.md")):
        text = description(skill)
        if not text:
            problems.append(f"{skill}: no description")
        if len(text) > MAX:
            problems.append(f"{skill}: description is {len(text)} characters once folded (max {MAX})")
        if "<" in text or ">" in text:
            problems.append(f"{skill}: description contains angle brackets, which the sync strips")
    return problems


if __name__ == "__main__":
    found = [p for arg in sys.argv[1:] for p in check(Path(arg))]
    print("\n".join(found))
    sys.exit(1 if found else 0)
```

- [ ] **Step 3: Implement `scripts/check_marketplace.py`**

```python
#!/usr/bin/env python3
"""Checks the team marketplace index: not named like the public marketplace, unique
plugin names, and every source a git-subdir pinned to a full commit sha."""
import json
import re
import sys

PUBLIC_NAME = "payit2"


def check(path: str) -> list[str]:
    data = json.load(open(path))
    problems = []
    if data.get("name") == PUBLIC_NAME:
        problems.append(f"marketplace name '{PUBLIC_NAME}' belongs to the public marketplace")
    seen = set()
    for p in data.get("plugins", []):
        name = p.get("name", "?")
        if name in seen:
            problems.append(f"{name}: duplicate plugin name")
        seen.add(name)
        if not p.get("description"):
            problems.append(f"{name}: no description")
        src = p.get("source", {})
        if src.get("source") != "git-subdir" or not src.get("url") or not src.get("path"):
            problems.append(f"{name}: source must be git-subdir with url and path")
        if not re.fullmatch(r"[0-9a-f]{40}", src.get("sha", "")):
            problems.append(f"{name}: sha must be a 40-character commit id")
    return problems


if __name__ == "__main__":
    found = check(sys.argv[1])
    print("\n".join(found))
    sys.exit(1 if found else 0)
```

- [ ] **Step 4: Run the tests**

Run: `python3 scripts/test_checks.py`
Expected: 5 tests OK.

- [ ] **Step 5: Implement `scripts/check-sources.sh`**

```bash
#!/bin/bash
# Validates every plugin this marketplace pins, at its pinned commit.
# Uses your own git credentials, so private sources (payit2-business) are checked too.
# --public-only (CI): sources the runner cannot read are reported, not checked.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_ONLY="${1:-}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
CLAUDE="${CLAUDE_BIN:-claude}"

$CLAUDE plugin validate "$ROOT" --strict
python3 "$ROOT/scripts/check_marketplace.py" "$ROOT/.claude-plugin/marketplace.json"

python3 - "$ROOT/.claude-plugin/marketplace.json" > "$WORK/sources.tsv" <<'PY'
import json, sys
for p in json.load(open(sys.argv[1]))["plugins"]:
    s = p["source"]
    print("\t".join([p["name"], s["url"], s["path"], s["sha"]]))
PY

status=0
while IFS=$'\t' read -r plugin url subdir sha; do
  echo "==> $plugin ($url @ ${sha:0:7}, $subdir)"
  repo="https://github.com/$url.git"
  if [[ "$PUBLIC_ONLY" == "--public-only" ]] && ! GIT_TERMINAL_PROMPT=0 git ls-remote "$repo" >/dev/null 2>&1; then
    echo "    private source: not readable here; run scripts/check-sources.sh locally before bumping this pin"
    continue
  fi
  dest="$WORK/$plugin"
  git clone --quiet --filter=blob:none --no-checkout "$repo" "$dest"
  git -C "$dest" sparse-checkout set "$subdir"
  git -C "$dest" checkout --quiet "$sha"
  $CLAUDE plugin validate "$dest/$subdir" --strict || status=1
  python3 "$ROOT/scripts/check_plugin.py" "$dest/$subdir" || status=1
done < "$WORK/sources.tsv"
exit $status
```

Run: `chmod +x scripts/check-sources.sh`

- [ ] **Step 6: Write the index**

Get the pins:
```bash
git -C ../payit2-campaign-assistant fetch --quiet && git -C ../payit2-campaign-assistant rev-parse origin/main
git -C ../payit2-business fetch --quiet && git -C ../payit2-business rev-parse origin/master
git -C ../payit2-business show origin/master:plugins/payit2-brand/.claude-plugin/plugin.json | python3 -c 'import json,sys; print(json.load(sys.stdin)["description"])'
```

`.claude-plugin/marketplace.json` (fill the two shas and the brand description from the commands above; the Assistant's description is copied from the public marketplace):
```json
{
  "name": "payit2-team",
  "owner": { "name": "PayIt2" },
  "metadata": { "description": "Private Claude plugin marketplace for the PayIt2 team" },
  "plugins": [
    {
      "name": "payit2-campaign-assistant",
      "source": {
        "source": "git-subdir",
        "url": "PayIt2/payit2-campaign-assistant",
        "path": "plugin",
        "ref": "main",
        "sha": "<output of the first command>"
      },
      "description": "AI-powered campaign assistant for PayIt2.com. Create, promote, and optimize any campaign type: fundraisers, events, and groups. Get guidance, generate content, and engage participants through conversation with Claude."
    },
    {
      "name": "payit2-brand",
      "source": {
        "source": "git-subdir",
        "url": "PayIt2/payit2-business",
        "path": "plugins/payit2-brand",
        "ref": "master",
        "sha": "<output of the second command>"
      },
      "description": "<output of the third command>"
    }
  ]
}
```

The Campaign Assistant pin starts at today's `main` (1.6.x plus fixes). `release.sh` moves it to 1.7.0 in Task 5.

- [ ] **Step 7: Check every source locally**

Run: `scripts/check-sources.sh`
Expected: both plugins validate and `check_plugin.py` prints nothing. If the brand plugin fails a sync rule, stop and report it to Brian: fixing it is a `payit2-business` change, outside this plan.

- [ ] **Step 8: Write `.github/workflows/validate.yml`**

```yaml
name: Validate

on:
  pull_request:
  workflow_dispatch:

concurrency:
  group: validate-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - name: Install the Claude CLI
        run: npm install -g @anthropic-ai/claude-code@2.1.252
      - name: Check unit tests for the checkers
        run: python3 scripts/test_checks.py
      - name: Index and public sources at their pinned commits
        run: scripts/check-sources.sh --public-only
```

- [ ] **Step 9: Commit**

```bash
git add .claude-plugin/marketplace.json scripts .github/workflows/validate.yml
git commit -m "feat: payit2-team marketplace index with sync-rule checks

Pins the Campaign Assistant and the brand plugin by commit. CI validates
the index and public sources; check-sources.sh covers private sources
with the developer's own credentials."
```

---

### Task 3: Repo docs and the draft PR

**Files (in `payit2-team-plugins`):**
- Modify: `README.md`
- Create: `CLAUDE.md`, `DOCS.md` (generated), `scripts/docs_index.py`, `.github/workflows/docs.yml`, `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Copy the governance files from the public marketplace**

```bash
cp ../payit2-plugins-marketplace/scripts/docs_index.py scripts/
cp ../payit2-plugins-marketplace/.github/workflows/docs.yml .github/workflows/
cp ../payit2-plugins-marketplace/.github/PULL_REQUEST_TEMPLATE.md .github/
```
Then open `docs.yml` and confirm it has `timeout-minutes` and `concurrency`; add them in the same shape as `validate.yml` if missing.

- [ ] **Step 2: Write `README.md`**

```markdown
---
title: "PayIt2 team plugins"
type: reference
doc_status: active
owner: claude-maintained
---
# PayIt2 team plugins

Private Claude plugin marketplace for the PayIt2 team. Customers use the public
`PayIt2/payit2-plugins-marketplace` instead.

| Plugin | What it does | Source |
|---|---|---|
| `payit2-campaign-assistant` | Create, promote and check in on campaigns, connected to PayIt2 | `PayIt2/payit2-campaign-assistant`, `plugin/` |
| `payit2-brand` | PayIt2 brand standards for anything you make | `PayIt2/payit2-business`, `plugins/payit2-brand/` |

## In claude.ai and Claude Desktop

Nothing to install. An org admin syncs this marketplace into the organization's plugin catalog.
To use the Campaign Assistant with your PayIt2 account, open it from Customize > Plugins and
connect PayIt2 on its Connectors tab.

## In Claude Code (once per person)

1. Let git read private PayIt2 repos: `gh auth login`, then `gh auth setup-git`.
2. Add the marketplace and install:

       claude plugin marketplace add PayIt2/payit2-team-plugins
       claude plugin install payit2-campaign-assistant@payit2-team
       claude plugin install payit2-brand@payit2-team

3. In `/plugin`, under Marketplaces, turn on auto-update for `payit2-team`.
4. If you installed either plugin from another marketplace before, uninstall that copy
   (`claude plugin list` shows where each came from). With two copies enabled, one copy's
   hooks are silently dropped, including the Campaign Assistant's confirmation before it
   changes campaign settings.
5. Signing in to PayIt2 from Claude Code is not available yet; it waits on a PayIt2 server
   fix. Until then the Campaign Assistant works standalone here, and you sign in from the
   Claude desktop app instead.

## Changing a pin

The Campaign Assistant's pin moves through `release.sh` in its own repo, which opens a PR
here. To move the brand plugin, set its `sha` to a `payit2-business` commit on `master`, run
`scripts/check-sources.sh`, and open a PR. CI checks the index and public sources; private
sources are only checked by that script.
```

- [ ] **Step 3: Write `CLAUDE.md`**

```markdown
---
title: "Org-Wide Standards"
type: standard
doc_status: active
owner: claude-maintained
---
# Org-Wide Standards

All org-wide rules are in `../payit2-business/PLATFORM-STANDARDS.md`. Read it, the CEO decisions
ledger and this repo's `README.md` before working here.

---

# CLAUDE.md

This repo is an index only: `.claude-plugin/marketplace.json` pins plugins that live in other
PayIt2 repos. Never copy plugin files into it. It must stay private: the claude.ai organization
sync only accepts a private marketplace repo.

- Run `python3 scripts/test_checks.py` and `scripts/check-sources.sh` before opening a PR.
- The Campaign Assistant pin is bumped by `release.sh` in `payit2-campaign-assistant`.
- Document index: `DOCS.md`, generated by `python3 scripts/docs_index.py generate .`.
```

- [ ] **Step 4: Generate the index, check, commit, push, open the PR**

```bash
python3 scripts/docs_index.py generate . && python3 scripts/docs_index.py check --strict .
git add README.md CLAUDE.md DOCS.md scripts/docs_index.py .github
git commit -m "docs: setup steps, repo rules and document index"
git push -u origin "$(git branch --show-current)"
gh pr create --draft --base main --title "PayIt2 team marketplace: Campaign Assistant and brand plugin" --body-file /tmp/pr2-body.md
```
`/tmp/pr2-body.md`: what the repo is, the two pins, how CI and `check-sources.sh` split the checking, the claude.ai and Claude Code steps, a link to the spec in the plugin repo, and the closing `🤖 Generated with [Claude Code](https://claude.com/claude-code)` line.

- [ ] **Step 5: Confirm CI**

Run: `gh pr checks <number> --watch` once the checks have registered.
Expected: `Validate` and the docs check pass.

---

### Task 4 (Brian): GitHub App access for the PayIt2 automation

The business repo's drift checker and app-verify workflows mint a token for the PayIt2 automation GitHub App (secret `PAYIT2_AUTOMATION_PRIVATE_KEY`) scoped to a list of repos. Adding `payit2-team-plugins` to that list fails unless the App is installed on the repo.

- [ ] **Step 1:** In GitHub, PayIt2 organization settings, GitHub Apps, the PayIt2 automation app, Configure: add `payit2-team-plugins` to its repository access.
- [ ] **Step 2 (Claude checks):** `gh api /repos/PayIt2/payit2-team-plugins/installation --jq .app_slug` lists the app. If the call is not permitted with Brian's token, Brian confirms in the UI.

---

### Task 5: Register the repo in `payit2-business`

**Files (in a `payit2-business` worktree):** `CLAUDE.md`, `.github/workflows/github-app-verify.yml`, `.github/workflows/standards-drift-checker.yml`, `OPEN_ITEMS.md`

The local `payit2-business` checkout is far behind with untracked blog files; never pull, stash or switch branches in it. Work in a separate worktree.

- [ ] **Step 1: Worktree on today's release branch**

```bash
cd ~/Source/PayIt2/payit2-business && git fetch --quiet origin
B="release/$(date +%Y-%m-%d)"
if git show-ref --verify --quiet "refs/remotes/origin/$B"; then
  git worktree add ../payit2-business-team-plugins "$B"
else
  git worktree add -b "$B" ../payit2-business-team-plugins origin/master && git -C ../payit2-business-team-plugins branch --unset-upstream
fi
```

- [ ] **Step 2: Edits**

In `CLAUDE.md`, after the `payit2-plugins-marketplace` row of the repo table, add:
```markdown
| **payit2-team-plugins** | Private plugin marketplace for the PayIt2 team (Claude Code and the claude.ai org catalog) | `PayIt2/payit2-team-plugins` |
```

In both workflow files, change
`repositories: payit2-website,payit2-app-v2,payit2-campaign-assistant,payit2-plugins-marketplace`
to
`repositories: payit2-website,payit2-app-v2,payit2-campaign-assistant,payit2-plugins-marketplace,payit2-team-plugins`.

In `github-app-verify.yml`, copy the existing `Verify token can read payit2-plugins-marketplace` step (or the last per-repo verify step if that one is named differently) and change the repo name in its name and `gh api` path to `payit2-team-plugins`.

In `OPEN_ITEMS.md`, under `### B-125. Internal PayIt2 skill marketplace`, append:
```markdown
**Started 2026-10-27 (Brian):** `PayIt2/payit2-team-plugins` is the private team marketplace (`payit2-team`), synced into the claude.ai organization catalog and installable in Claude Code. It launches with the Campaign Assistant and the brand plugin. Packaging the `.claude-skills/` canon as a plugin in it is the open next step. Design: `payit2-campaign-assistant/docs/specs/2026-10-27-prod-connector-e2e-team-marketplace-design.md`.
```

Also add the new repo to the local root `~/Source/PayIt2/CLAUDE.md` repo table (not in git): `| payit2-team-plugins/ | PayIt2/payit2-team-plugins | Private | Plugin index for the PayIt2 team |`.

- [ ] **Step 3: Commit and push**

```bash
cd ../payit2-business-team-plugins
git diff --stat
git add CLAUDE.md .github/workflows/github-app-verify.yml .github/workflows/standards-drift-checker.yml OPEN_ITEMS.md
git commit -m "chore: register payit2-team-plugins (B-125 started)"
git push -u origin "$(git branch --show-current)"
```

If an open PR already exists for this branch, the commit joins it. Otherwise open a draft PR titled `Register payit2-team-plugins (B-125)` with the closing attribution line. Do not merge; Task 4 must be done before this merges.

---

### Task 6: Release 1.7.0 (after Plan 1's PR merges)

- [ ] **Step 1: Bring the plugin checkout to main**

```bash
cd ~/Source/PayIt2/payit2-campaign-assistant
gh pr view release/2026-10-27 --json state -q .state   # must print MERGED
git switch main && git pull --ff-only
```

- [ ] **Step 2: Dry run, then release**

```bash
DRY_RUN=1 ./release.sh v1.7.0 "v1.7.0 - PayIt2 connector and end-to-end tests"
./release.sh v1.7.0 "v1.7.0 - PayIt2 connector and end-to-end tests"
```
Expected: the dry run prints the tag and both pin bumps and changes nothing; the real run creates the `v1.7.0` release and opens (or updates) draft pin PRs in `payit2-plugins-marketplace` and `payit2-team-plugins`.

- [ ] **Step 3: Check the team pin with private sources**

```bash
cd ~/Source/PayIt2/payit2-team-plugins && git switch "release/$(date +%Y-%m-%d)" && scripts/check-sources.sh
```
Expected: both plugins pass.

- [ ] **Step 4: After the public pin PR merges**

Run the `gh release create … -R PayIt2/payit2-plugins-marketplace` command that `release.sh` printed, so the public zips rebuild. Check: `gh release view v1.7.0 -R PayIt2/payit2-plugins-marketplace --json assets -q '.assets[].name'` lists the zips within a minute.

---

### Task 7 (Brian): claude.ai, Claude Code and the prod smoke check

- [ ] **Step 1: claude.ai.** Give the Claude GitHub App read access to `payit2-team-plugins`, `payit2-campaign-assistant` and `payit2-business`. In the organization's plugin settings, add the `PayIt2/payit2-team-plugins` marketplace. Confirm the sync shows no warnings; if it does, send Claude the warning text.
- [ ] **Step 2: Claude Code.** Follow the README's Claude Code steps on your own machine, including uninstalling any other copy of `payit2-brand` or the Campaign Assistant. `claude plugin list` should show both plugins from `@payit2-team` only.
- [ ] **Step 3: Prod smoke.** In a Cowork task in the Claude desktop app, open the Campaign Assistant from Customize > Plugins, connect PayIt2 on its Connectors tab as the prod smoke organizer, then run `/payit2-campaign-assistant:check-in` on one of that organizer's campaigns. Pass: the reply uses that campaign's real numbers. Then ask Claude to change the campaign's title and decline the permission prompt: the title must stay the same.
- [ ] **Step 4: claude.ai chat.** In a claude.ai chat with the org plugin enabled, connect PayIt2 on the plugin's Connectors tab and ask about a campaign. Pass: live numbers come back.

---

### Task 8: The heads-up to Thomas

- [ ] **Step 1:** Read the Voice Cheat Sheet and the Voice & Tone Guide in `~/Source/Augusto/01 - 2nd Brain/2nd Brain - Brian/10 - Areas/Brian/Personal Brand/`.
- [ ] **Step 2:** Draft, in Brian's voice and in his name, a short message to Thomas covering: the public plugin now ships with the production connector (his GOV-1 call; sign-in only, no keys); the save tools write content nothing reads, so the plugin stopped promising it and the app-v2 fix is his product decision; B-125 started with `payit2-team-plugins`; the Claude GitHub App now reads `payit2-business` because the brand plugin lives there; the merge signals needed (plugin PR, team marketplace PR, business PR, public pin PR); and the workload identity rule needed to run the live suite in CI.
- [ ] **Step 3:** Run the `proofread` skill on the draft, then give it to Brian to edit and send. Claude never sends it.
