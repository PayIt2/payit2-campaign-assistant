---
title: "Production connector, end-to-end tests and team marketplace: design"
type: spec
doc_status: active
owner: claude-maintained
---
# Production connector, end-to-end tests and team marketplace: design

**Date:** 2026-10-27
**Author:** Brian Anderson + Claude
**Status:** Design approved section by section in session; this written spec awaits Brian's review
**Target release:** Campaign Assistant 1.7.0

---

## 1. Goal

The PayIt2 app is live in production, and so is its MCP server at `https://mcp.payit2.com/mcp`. This work does three things:

1. **Connector.** The Campaign Assistant plugin ships with the production connector, so an organizer who signs in to PayIt2 gets live campaign data and can create and update campaigns from Claude.
2. **End-to-end tests.** A test suite proves the plugin and the connector work together, including creating a campaign, against dev.
3. **Team marketplace.** A private marketplace lets the PayIt2 team install internal plugins in Claude Code and through the claude.ai organization plugin catalog.

## 2. What is true today

- **Production MCP is live.** `GET /health` returns 200. OAuth discovery (`/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`) is served. An unauthenticated `POST /mcp` returns 401 with a `WWW-Authenticate` header that points at the resource metadata.
- **The server accepts two credentials.** It checks `x-api-key` first, then `Authorization: Bearer` (OAuth access token, then service JWT). An empty `x-api-key` header falls through to Bearer (`mcp-server/src/auth/authenticate.ts` in app-v2).
- **The plugin bundles no MCP server.** `plugin.json` declares `userConfig.payit2_api_key`, but nothing reads it. The skills already describe a standalone mode and an MCP-connected mode, and every tool and prompt name they reference exists on the server today.
- **One hook would break once a connector is bundled.** The `PreToolUse` matcher is `mcp__payit2__update_campaign_settings`. A plugin-bundled server's tools are named `mcp__plugin_payit2-campaign-assistant_payit2__<tool>`, so the confirmation hook would never fire.
- **Content saved through the connector is invisible.** The four `save_*` tools (story, thank-you, update post, improvement notes) write to the `ai_content` table through `POST /api/v1/campaigns/:id/ai-content`, the only route on it. No API route returns that content, and no page shows it. The campaign feed is `/api/v1/campaigns/:id/updates`, which no connector tool calls. The `engage` and `promote` skills nonetheless say `save_update_post` publishes to the campaign feed, and `engage` and `check-in` say saved content shows in the organizer's dashboard.
- **The public marketplace must stay public.** `PayIt2/payit2-plugins-marketplace` is public and payit2.com tells customers to add it. The claude.ai organization sync only accepts a private or internal marketplace repo on github.com, so the public repo cannot feed the team catalog. B-43 (2026-06-09) also says internal tooling should not be hosted in the public marketplace.
- **Standards that apply** (PLATFORM-STANDARDS and POLICIES):
  - §3: tests never skip, and assert outcomes rather than strings.
  - §4: two secret buckets only; dev test credentials may live in GitHub secrets and Secrets Manager; prod credentials are never readable from CI; no `ANTHROPIC_API_KEY` is stored, and CI reaches Anthropic through workload identity federation rules that only Thomas can add.
  - §11.1: every workflow has a timeout and `concurrency` with cancel-in-progress.
  - §15 and CHG-2 to CHG-4: feature branch to PR only, one daily `release/YYYY-MM-DD` PR per repo, the CEO gives the merge signal, every PR gets a posted review, no `Co-Authored-By` trailers.
  - §16: "Organizer", never "User"; no em dashes in content.

## 3. Decisions

| # | Decision | Chosen | Why |
|---|---|---|---|
| D1 | How organizers connect | Sign in with PayIt2 (OAuth) only; remove the unused API-key setting | Works in Claude Code, Cowork and claude.ai Connectors; nothing to paste or rotate; a blank optional key could break sign-in |
| D2 | Mentioning sign-in | One light mention per conversation, only when an organizer asks about their own live numbers and the tools are absent | Standalone stays the default; no greeting nag |
| D3 | E2E shape | A no-model connector check in CI, plus a live run of the real plugin, model and dev connector | Proves the real pieces work together; the live run moves to CI once Thomas adds the identity rule |
| D4 | Campaign creation in tests | Covered in both layers, with hard-delete cleanup | Brian asked for it; `create_campaign` makes drafts and owners can hard-delete campaigns with no payments |
| D5 | Team marketplace contents | Campaign Assistant and the brand plugin from `payit2-business/plugins/payit2-brand` | The business copy is current (2026-09-03); the `payit2-brand-plugin` repo stopped in April |
| D6 | Where the team uses it | Claude Code and the claude.ai organization catalog; Brian is the claude.ai admin | Brian's answer |
| D7 | How it lands | PayIt2's git rules: draft PRs on `release/YYYY-MM-DD`, Thomas gives the merge signal | CHG-2 and §15 |
| D8 | `release.sh` | Marketplace pin bumps go through draft PRs instead of direct pushes to `main` | §15; approved by Brian on spec review |
| D9 | Saved content nobody sees | Test what is true today: the skills stop promising the feed and the dashboard, hand the organizer the text to post, and still call the save tools for the record. The story is checked through the campaign description. Making the save tools reach the feed is a separate app-v2 task. | Brian, 2026-10-27; posting to the public feed is a product call for Thomas |

## 4. Part A: The connector (plugin 1.7.0)

### Files

| File | Change |
|---|---|
| `plugin/.mcp.json` (new) | One server, `payit2`: `{"type": "http", "url": "https://mcp.payit2.com/mcp"}`, no headers |
| `plugin/.claude-plugin/plugin.json` | Remove `userConfig`; version `1.7.0` |
| `plugin/hooks/hooks.json` | `PreToolUse` matcher becomes the regex `mcp__.*payit2.*__update_campaign_settings`; `SessionStart` prompt says "not signed in" instead of "no API key configured" |
| `plugin/skills/campaign-context/SKILL.md` | Replace the "never mention" rule with the light mention (below); add the confirm-before-changing-settings rule |
| `plugin/skills/campaign/SKILL.md` | Add the confirm-before-changing-settings rule to Step 8 |
| `plugin/skills/check-in`, `promote`, `engage` `SKILL.md` | Replace API-key wording with signing in to PayIt2. Remove every claim that saved content appears in the campaign feed or the organizer's dashboard: the skill gives the organizer the finished text to post themselves, and calls the matching `save_*` tool to keep a record (D9). |
| `README.md` | "Add your API key" becomes "Sign in to PayIt2"; describe where sign-in lives in each Claude surface |
| `CHANGELOG.md` | 1.7.0 entry |
| `payit2-campaign-assistant.zip` | Rebuilt with `./build-plugin.sh` |

### The hook matcher

The regex `mcp__.*payit2.*__update_campaign_settings` matches three ways the tool can appear:

- the bundled connector: `mcp__plugin_payit2-campaign-assistant_payit2__update_campaign_settings`
- a hand-added server named `payit2`, per `docs/API-KEYS.md` in app-v2: `mcp__payit2__update_campaign_settings`
- the e2e live run's dev server, also named `payit2`

This is verified by a real run (Part B, scenario 3), not just from the docs.

### Confirmation in skill text

claude.ai chat ignores plugin hooks. The skills therefore carry the same rule in their own words: before changing any campaign setting, show the organizer each field's current and new value and wait for a yes. The hook stays as the enforced check in Claude Code and Cowork.

### The light mention

In `campaign-context`, when the organizer asks about their own live numbers and no PayIt2 tools are present, Claude says once per conversation that signing in to PayIt2 lets it pull those numbers. In Claude Code that is `/mcp`, then `payit2`, then authenticate. In claude.ai it is the Connectors settings. Then the skill carries on in standalone mode. The `SessionStart` greeting stays silent when the organizer is not signed in.

### Checks

- `claude plugin validate plugin --strict` passes.
- No skill description exceeds 1,024 characters once folded, and none contains angle brackets (claude.ai sync rules).

## 5. Part B: End-to-end tests

### Layout

All test code lives in `tests/` at the repo root, outside `plugin/`, so none of it ships in the zip. Stack: Node 24, TypeScript, vitest and `@modelcontextprotocol/sdk`, matching the app-v2 MCP server's tests. `npx tsc --noEmit` runs before every commit (§15).

```
tests/
  package.json
  tsconfig.json
  lib/            env guard, MCP client, dev REST client, fixture and cleanup helpers
  connector/      Layer 1 tests (vitest)
  live/           Layer 2 runner, scenarios, dev MCP config template
```

### Configuration and the prod guard

| Variable | Default | Notes |
|---|---|---|
| `E2E_FIXTURE_API_KEY` | none, required | Read and write dev key for the fixture organizer. Missing key fails the run; tests never skip. |
| `E2E_MCP_URL` | `https://dev.mcp.payit2.com/mcp` | |
| `E2E_API_URL` | `https://dev.api.payit2.com` | |

Every test that writes refuses to start unless both URLs point at `dev.` hosts or localhost. The only prod contact is the unauthenticated discovery check in Layer 1.

### Fixture data and cleanup

- **Organizer:** the existing dev fixture organizer (`payit2/dev/e2e-fixture-organizer` in Secrets Manager).
- **Fixture campaign:** one campaign named `Campaign Assistant e2e fixture`, found by exact title or created once through the REST API.
- **Run marker:** every write carries a run marker (`[e2e <run id>]`) in a title or body.
- **Cleanup:** campaigns created by a run are hard-deleted with `DELETE /api/v1/campaigns/:id/permanent` when the run ends, and update posts with `DELETE .../updates/:updateId`. Each run also starts with a sweep that removes leftover `[e2e` drafts and update posts from crashed runs.

### Layer 1: Connector check (no model, runs in CI)

| Check | Passes when |
|---|---|
| No drift | Every tool and prompt name referenced in `plugin/` (skills, agent, hooks, scripts) is in the server's `listTools` and `listPrompts`. A short allowlist covers backticked tokens that are not tool names, such as the filter value `needs_attention`. A failure names the missing tool and the file that references it. |
| Read outcomes | `list_my_campaigns` returns the fixture campaign; `get_campaign_overview`, `get_campaign_health` and `get_payment_summary` report the same goal, amount raised and status as `GET /api/v1/campaigns/:id` on the dev API. |
| Write round trip | `create_campaign` through the connector, as a draft, with the run marker in the title; the dev API returns that title, goal, end date and draft status; the campaign is then hard-deleted and a read returns 404. |
| Save round trip | `save_update_post` on the fixture campaign with the run marker returns `Saved update_post content for campaign <id>.` and not `Failed to save content`. The tool's reply is the only observable outcome until the app-v2 follow-up gives saved content a read path. |
| Sign-in path | `POST /mcp` with no credentials returns 401 with `resource_metadata` in `WWW-Authenticate`. |
| Prod URL | Unauthenticated only: prod `/health` returns 200, and prod's `oauth-protected-resource` names `https://mcp.payit2.com/mcp`, the URL in `plugin/.mcp.json`. |

**CI workflow `.github/workflows/connector.yml`:**
- **Triggers:** pull requests that touch `plugin/**` or `tests/**`, manual dispatch, and a weekly schedule. The weekly run catches a tool renamed in app-v2, which no plugin PR would trigger.
- **Steps:** `npm ci`, the connector suite, then `claude plugin validate plugin --strict`.
- **Cost controls:** `timeout-minutes: 15` and `concurrency` with cancel-in-progress.
- **Secret:** `E2E_FIXTURE_API_KEY` from the repo's Actions secrets. Pull requests from forks get no secret and fail loudly, which is acceptable for this repo.

### Layer 2: Live run (real model, plugin and dev connector)

`npm run live` runs each scenario as a headless Claude session:

```
claude -p "<scenario prompt>" \
  --plugin-dir plugin \
  --mcp-config <dev config with x-api-key> \
  --output-format stream-json --verbose \
  --permission-mode dontAsk \
  --allowedTools "mcp__payit2__*" \
  --model claude-sonnet-5-5 \
  --max-turns <cap>
```

- **Init check:** before any scenario counts, the `system/init` event must show the plugin loaded with no `plugin_errors`, the dev `payit2` server connected, and no other plugins or MCP servers loaded. The run fails if Brian's own plugins or servers leak in.
- **Where it runs:** locally on Brian's own Claude login, as §33 expects for interactive sessions.
- **Output:** transcripts and a JSON summary go to `tests/live/.runs/<timestamp>/` (gitignored). The summary is attached to PR 1.

| # | Scenario | Passes when |
|---|---|---|
| 1 | `/check-in` on the fixture campaign | `get_campaign_health` is called, and the reply states the amount raised that the dev API reports |
| 2 | Draft a progress update that includes the run marker | `save_update_post` is called with content containing the marker and returns `Saved`; the reply gives the organizer the full update text with the marker; the reply does not claim the update was posted to the campaign feed |
| 3 | Ask to change the fixture campaign's title, without confirming | The confirmation hook fires, and the dev API shows the title unchanged |
| 4 | No dev connector; ask "how is my campaign doing?" | The plugin's bundled prod server shows as not signed in, and the reply contains exactly one sign-in mention followed by standalone questions |
| 5 | `/campaign` with a complete brief (a legal defense fund with goal, end date and theme, "go ahead and create it as a draft", no cover image) | The dev API shows a new draft owned by the fixture organizer with the marker title, the requested goal, the chosen theme, and a description of at least 400 characters that names the cause from the brief. The description is where the story appears on the campaign page (D9). The theme step passes the confirmation hook because the brief already said go ahead. |

**CI later:** a dispatch-only workflow for the live run waits until Thomas adds a workload identity federation rule for this repo. It is a follow-up, because §33 says an automation is not done until it has one green run.

### Prod smoke (manual, at release)

After release, Brian installs 1.7.0, signs in as the prod smoke organizer (ledger 2026-10-18) and runs `/check-in`. This is added to the release checklist in the README. No prod credential is used in CI.

## 6. Part C: The team marketplace

### Repo

The new private repo is `PayIt2/payit2-team-plugins`. Like the public marketplace, it holds only an index.

`.claude-plugin/marketplace.json`:

```json
{
  "name": "payit2-team",
  "owner": { "name": "PayIt2" },
  "metadata": { "description": "Private marketplace for the PayIt2 team" },
  "plugins": [
    {
      "name": "payit2-campaign-assistant",
      "source": { "source": "git-subdir", "url": "PayIt2/payit2-campaign-assistant", "path": "plugin", "ref": "main", "sha": "<1.7.0 commit>" },
      "description": "<same as the public listing>"
    },
    {
      "name": "payit2-brand",
      "source": { "source": "git-subdir", "url": "PayIt2/payit2-business", "path": "plugins/payit2-brand", "ref": "master", "sha": "<pinned commit>" },
      "description": "<from the brand plugin's plugin.json>"
    }
  ]
}
```

The marketplace name `payit2-team` must differ from the public `payit2`. The claude.ai sync rules hold: the repo is private, both sources are in the PayIt2 org, `git-subdir` is supported, and neither plugin has a top-level `bin/`.

Other files mirror the public marketplace: `README.md` with the setup steps below, `CLAUDE.md`, `DOCS.md` with `scripts/docs_index.py`, the docs workflow and a PR template. The exact set is whatever the standards drift checker expects.

### Validation

- **CI (`validate.yml`, on every PR):**
  - `marketplace.json` parses and every entry has a name, source and description.
  - Names are unique, and the marketplace name is not `payit2`.
  - `claude plugin validate` runs on the Campaign Assistant source at its pinned commit. That repo is public, so the default token can read it.
  - Folded skill descriptions are 1,024 characters or less, with no angle brackets.
  - `plugin.json` keys come from the manifest reference.
  - `timeout-minutes` and `concurrency` are set.
- **Local `scripts/check-sources.sh`:** runs the same checks on every pinned source, including `payit2-business`, with the developer's own git credentials. CI cannot read `payit2-business` without a GitHub App secret in this repo, and adding one is a separate decision. The claude.ai sync's warnings panel is the final backstop.

### Releases

`release.sh` in the plugin repo bumps the Campaign Assistant pin in both marketplaces. The brand plugin's pin moves by hand, after `check-sources.sh` passes.

### claude.ai setup (Brian, as admin)

1. Give the Claude GitHub App read access to `payit2-team-plugins`, `payit2-campaign-assistant` and `payit2-business`. The app has to read `payit2-business` because the brand plugin lives there.
2. In the organization's plugin settings, add the `PayIt2/payit2-team-plugins` marketplace, and confirm the sync completes with no warnings.

### Claude Code setup (each team member, once)

1. Run `gh auth login`, then `gh auth setup-git`, so Claude Code's git can read the private repos.
2. Run `/plugin marketplace add PayIt2/payit2-team-plugins`, then install `payit2-campaign-assistant@payit2-team` and `payit2-brand@payit2-team`.
3. Turn on auto-update for the marketplace in `/plugin` under Marketplaces. It is off by default for marketplaces Anthropic doesn't run.
4. Uninstall any copy of the Assistant installed from the public marketplace. With both copies enabled, one copy's hooks are silently dropped, including the confirmation hook.

### Housekeeping (§14.6)

- **`payit2-business`:** add the new repo to the `CLAUDE.md` repo table and to the `repositories:` lists in `github-app-verify.yml` and `standards-drift-checker.yml`; update B-125 in `OPEN_ITEMS.md`.
- **Local `PayIt2/CLAUDE.md`:** add the new repo to its repo table. This file is not in git.

## 7. Part D: How it lands

### PRs and order

| # | Repo | Contents |
|---|---|---|
| 1 | `payit2-campaign-assistant` | Part A, Part B, this spec and the implementation plan, 1.7.0 changelog and zip |
| 2 | `payit2-team-plugins` (new) | Part C index, validation, docs |
| 3 | `payit2-business` | Part C housekeeping |
| 4 | `payit2-plugins-marketplace` | Public pin moves to 1.7.0 |

1. PR 1 merges first.
2. `release.sh v1.7.0` then tags the release and pins both marketplaces to the merged commit on `main`. A pin to a branch commit would break once that branch is squashed away.
3. PR 2 merges after that, then Brian completes the claude.ai setup.

All PRs open as drafts on `release/YYYY-MM-DD` branches dated the day each one opens. Each gets a review posted on it (CHG-3), and Thomas gives the merge signal (CHG-2). Commits are conventional, with no `Co-Authored-By` trailers (CHG-4).

### `release.sh` goes through PRs (D8, approved 2026-10-27)

`release.sh` pushed its commits straight to `main` in both repos, and §15 says every change reaches `main` through a PR. Since this work already edits `release.sh` to add the team marketplace, its marketplace pin bumps now go to a `release/YYYY-MM-DD` branch with a draft PR in each marketplace repo, instead of a direct push. The plugin side no longer commits: it refuses to run unless `main` already carries the release version, then tags `main`. PR 4 above is the first PR this produces.

### Brian's steps

1. Mint a read-and-write dev API key for the fixture organizer. Store it in Secrets Manager with the fixture identity, and as the `E2E_FIXTURE_API_KEY` Actions secret on `payit2-campaign-assistant`.
2. Run the live suite himself, or let Claude run it on his login.
3. Complete the claude.ai setup after PR 2 merges.
4. Run the prod smoke check after release.
5. Send Thomas a heads-up. Claude drafts it in Brian's voice for him to edit. It covers:
   - the public plugin now ships with the prod connector (a GOV-1 product call)
   - B-125 moved forward
   - the Claude GitHub App reading `payit2-business`
   - a merge signal for PRs 1 to 4
   - a workload identity rule so the live run can move to CI

## 8. Done when

- `claude plugin validate plugin --strict` is clean.
- The connector check is green in CI on PR 1.
- The live run passes all five scenarios locally, with the summary attached to PR 1.
- 1.7.0 is released, both marketplaces pin it, and the prod smoke check passes.
- The claude.ai organization catalog shows the team marketplace synced with no warnings.
- A fresh Claude Code install from `@payit2-team` loads both plugins, and the connector signs in.

## 9. Out of scope (follow-ups)

- **app-v2: make saved content reach the organizer.** `save_update_post` should create a real campaign update (or a draft one) through the updates route, and saved stories, thank-yous and notes need a read path or a dashboard surface. Posting to the public feed may notify participants, so this is Thomas's product call. Once it lands, the skills can promise the feed again and the tests can read the content back.
- The live run in CI, after Thomas adds the identity rule.
- Archiving the `payit2-brand-plugin` repo.
- The payit2.com AI assistant page, if it still tells organizers to add an API key (website repo).
- CI validation of private plugin sources through a GitHub App token.
- B-1, submitting the plugin to Claude's public Discover tab.

## 10. To verify during the build

| Unknown | How it is settled |
|---|---|
| The regex matcher fires for the plugin-prefixed tool name | Scenario 3 |
| The existing `PreToolUse` prompt hook's reply format blocks the call when unconfirmed (its prompt asks for `APPROVED` or `NEEDS_CONFIRMATION`, which may not be the reply format prompt hooks expect) | Scenario 3; reword the hook prompt if it does not block |
| `--mcp-config` expands environment variables in headers | If it does not, the runner writes a temporary config outside the repo at run time and never logs it |
| The live run can be isolated from Brian's own plugins and MCP servers | The init check fails the run if anything else loads; options are `--bare` with a personal Anthropic key, or `--strict-mcp-config` with `--setting-sources` |
| The `stream-json` event shapes for tool calls and hook results | Read from the first real run and pinned in the parser's tests |
| The brand plugin passes the sync rules | `check-sources.sh` before PR 2 |
