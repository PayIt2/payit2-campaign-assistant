---
title: "Campaign Assistant 1.7.0: connector, hooks and e2e tests (implementation plan)"
type: reference
doc_status: active
owner: claude-maintained
---
# Campaign Assistant 1.7.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Campaign Assistant with the production PayIt2 connector, working hooks, honest copy, and a two-layer end-to-end test suite against dev.

**Architecture:** The plugin bundles one HTTP MCP server (`plugin/.mcp.json`) with OAuth sign-in only. All test code lives in `tests/` (outside the shipped `plugin/` folder): offline unit tests, a no-model connector suite that runs in CI against dev with an API key, and a live runner that drives headless `claude -p` with the plugin and a dev connector, then checks outcomes through the dev REST API.

**Tech Stack:** Node 24, TypeScript 6, vitest 5, `@modelcontextprotocol/sdk` 1.32, tsx, Claude Code CLI (`claude -p`, `claude plugin validate`), bash, GitHub Actions.

**Spec:** `docs/specs/2026-10-27-prod-connector-e2e-team-marketplace-design.md` (decisions D1 to D9). Read it first. Plan 2 (`docs/superpowers/plans/2026-10-27-team-marketplace-and-release.md`) covers the team marketplace, the business repo housekeeping and the release itself.

## Global Constraints

- Branch: `release/2026-10-27` in `payit2-campaign-assistant`, created from `origin/main`, upstream unset. Push with `git push -u origin release/2026-10-27`. Never commit to `main`.
- Conventional commit messages. **No `Co-Authored-By` trailer on any commit** (CHG-4). Author identity is the repo's configured `brian@payit2.com`.
- Copy rules (§16): the person running a campaign is the **Organizer**, never "User". No em dashes (`—`) or en dashes in any new or rewritten text. When a passage you replace contains em dashes, the replacement has none.
- Never print, log or commit an API key or token. Keys come from the environment or the macOS Keychain.
- Every write in a test goes to a `dev.*.payit2.com` host or localhost; `assertDevTarget` enforces it.
- Tests never skip (§3). A missing key fails the run with a message saying where the key goes.
- Every workflow has `timeout-minutes` and `concurrency` with `cancel-in-progress: true` (§11.1).
- Action versions follow the org: `actions/checkout@v7`, `actions/setup-node@v7`.
- Server facts this plan relies on (verified 2026-10-27 in app-v2 `master` at `d424a5e4`):
  - MCP auth: `x-api-key` matching `/^pi2_(live|test)_/`, else Bearer. No credentials returns 401 with `WWW-Authenticate: Bearer resource="…", resource_metadata="…"`.
  - `create_campaign` inputs: `title`, `mode` (`fundraiser` | `registration` | `group_payment`), `description`, `blurb`, `goalAmount`, `publish` (default false). There is no end-date input. Output lines: `**ID:** <id>`, `**Status:** draft`, `**Goal:** $<n>`.
  - `get_campaign_overview` output: `**Status:** <status>`, `**Raised:** $<raised> of $<goal> goal`. `get_campaign_health`: `**Raised:** $<raised> of $<goal> goal (<pct>%)`. `get_payment_summary`: `**Total Payments:** <n>` when payments exist.
  - `save_*` tools reply `Saved <type> content for campaign <id>.` or `Failed to save content: …`.
  - REST: `GET /api/v1/campaigns/:id` returns `title`, `status`, `goalAmount`, `totalRaised`, `description`, `themeId`, `role`; `GET /api/v1/campaigns?search=…` lists the organizer's campaigns; `GET /api/v1/campaigns/:id/payments` returns an array; `DELETE /api/v1/campaigns/:id/permanent` hard-deletes a campaign with no payments.
- Headless Claude facts (probed 2026-10-27 on CLI 2.1.252):
  - `--strict-mcp-config` drops the plugin's own MCP server as well as user servers.
  - Prompt-type hooks are rejected on `SessionStart`.
  - The model ID `claude-haiku-5-5` is unknown to CLI 2.1.252; use the aliases `sonnet` / `haiku`.
  - The `system/init` event carries `plugins[{name}]`, `mcp_servers[{name,status}]`, `tools[]`, `skills[]`. Hook events are `system` / `hook_response` with `hook_event`, `hook_name`, `outcome`, `output`. The `result` event carries `result`, `is_error`, `total_cost_usd`, `permission_denials`.
  - A temporary `HOME` isolates the run from the developer's own plugins and MCP servers, but also drops the login, so the runner authenticates with `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or `ANTHROPIC_API_KEY`.

## File Structure

| Path | Responsibility |
|---|---|
| `plugin/.mcp.json` (new) | The production connector |
| `plugin/.claude-plugin/plugin.json` | Manifest: `userConfig` removed, version 1.7.0 |
| `plugin/hooks/hooks.json` | SessionStart and PreToolUse as command hooks; UserPromptSubmit unchanged; SubagentStart and Stop removed |
| `plugin/scripts/session-start.sh` (new) | Startup context for Claude |
| `plugin/scripts/confirm-settings-change.sh` (new) | Asks the organizer to approve settings changes |
| `plugin/scripts/save-summary.sh` (deleted) | Only reachable from the broken Stop hook |
| `plugin/skills/*/SKILL.md`, `plugin/agents/campaign-assistant.md`, `plugin/scripts/detect-campaign-url.sh` | Copy: sign-in, light mention, confirmation rule, no feed or dashboard promises |
| `README.md`, `CHANGELOG.md`, `payit2-campaign-assistant.zip` | Docs and release artifact |
| `tests/package.json`, `tests/package-lock.json`, `tests/tsconfig.json`, `tests/vitest.config.ts`, `tests/.gitignore`, `tests/README.md` | Test harness |
| `tests/lib/env.ts` | Config, Keychain lookup, dev-only guard |
| `tests/lib/parse.ts` | Parsers for MCP tool text |
| `tests/lib/references.ts` | Tool and prompt names referenced by `plugin/` |
| `tests/lib/mcp.ts` | MCP client over Streamable HTTP with `x-api-key` |
| `tests/lib/api.ts` | Dev REST client |
| `tests/lib/fixture.ts` | Fixture campaign, run marker, leftover sweep |
| `tests/plugin/plugin.unit.test.ts` | Offline checks of the shipped plugin files |
| `tests/connector/*.connector.test.ts` | Layer 1 |
| `tests/live/stream.ts` | Parser for `stream-json` output |
| `tests/live/claude.ts` | Spawns isolated `claude -p` runs |
| `tests/live/scenarios.ts` | The five live scenarios |
| `tests/live/run.ts` | Layer 2 entry point |
| `.github/workflows/connector.yml` | CI for Layer 1, unit tests and plugin validation |
| `release.sh` | Tag main, open marketplace pin PRs |

---

### Task 1: Test harness and the dev-only guard

**Files:**
- Create: `tests/package.json`, `tests/tsconfig.json`, `tests/vitest.config.ts`, `tests/.gitignore`, `tests/lib/env.ts`
- Test: `tests/lib/env.unit.test.ts`

**Interfaces:**
- Produces: `E2EConfig { apiKey: string; mcpUrl: string; apiUrl: string }`, `loadConfig(env?, keychain?): E2EConfig`, `assertDevTarget(url: string): void`, `readKeychain(service: string): string | undefined`, constants `KEYCHAIN_SERVICE = "payit2-e2e-fixture-api-key"`, `CLAUDE_TOKEN_SERVICE = "payit2-e2e-claude-token"`.

- [ ] **Step 1: Create the harness files**

`tests/package.json`:
```json
{
  "name": "payit2-campaign-assistant-tests",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run .unit.test",
    "connector": "vitest run .connector.test",
    "live": "tsx live/run.ts"
  },
  "devDependencies": {
    "@modelcontextprotocol/sdk": "^1.32.1",
    "@types/node": "^26.6.5",
    "tsx": "^4.23.15",
    "typescript": "^6.0.3",
    "vitest": "^5.0.0"
  }
}
```

`tests/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

`tests/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
```

`tests/.gitignore`:
```
node_modules/
live/.runs/
```

- [ ] **Step 2: Install**

Run: `cd tests && npm install`
Expected: `tests/package-lock.json` is created, no errors.

- [ ] **Step 3: Write the failing test**

`tests/lib/env.unit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { assertDevTarget, loadConfig } from "./env.js";

const KEY = "pi2_live_0123456789abcdef";
const noKeychain = () => undefined;

describe("assertDevTarget", () => {
  it("accepts dev hosts and localhost", () => {
    expect(() => assertDevTarget("https://dev.mcp.payit2.com/mcp")).not.toThrow();
    expect(() => assertDevTarget("https://dev.api.payit2.com")).not.toThrow();
    expect(() => assertDevTarget("http://localhost:3003/mcp")).not.toThrow();
  });
  it("refuses production and foreign hosts", () => {
    expect(() => assertDevTarget("https://mcp.payit2.com/mcp")).toThrow(/Refusing/);
    expect(() => assertDevTarget("https://api.payit2.com")).toThrow(/Refusing/);
    expect(() => assertDevTarget("https://dev.example.com")).toThrow(/Refusing/);
  });
});

describe("loadConfig", () => {
  it("fails loudly when no key is available", () => {
    expect(() => loadConfig({}, noKeychain)).toThrow(/E2E_FIXTURE_API_KEY/);
  });
  it("rejects a value that is not a PayIt2 key", () => {
    expect(() => loadConfig({ E2E_FIXTURE_API_KEY: "hello" }, noKeychain)).toThrow(/pi2_live_/);
  });
  it("uses dev defaults", () => {
    expect(loadConfig({ E2E_FIXTURE_API_KEY: KEY }, noKeychain)).toEqual({
      apiKey: KEY,
      mcpUrl: "https://dev.mcp.payit2.com/mcp",
      apiUrl: "https://dev.api.payit2.com",
    });
  });
  it("falls back to the Keychain", () => {
    expect(loadConfig({}, () => KEY).apiKey).toBe(KEY);
  });
  it("refuses a production override", () => {
    expect(() =>
      loadConfig({ E2E_FIXTURE_API_KEY: KEY, E2E_API_URL: "https://api.payit2.com" }, noKeychain),
    ).toThrow(/Refusing/);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `cd tests && npm test`
Expected: FAIL, `Cannot find module './env.js'` or similar.

- [ ] **Step 5: Implement `tests/lib/env.ts`**

```ts
import { execFileSync } from "node:child_process";

export const KEYCHAIN_SERVICE = "payit2-e2e-fixture-api-key";
export const CLAUDE_TOKEN_SERVICE = "payit2-e2e-claude-token";

export interface E2EConfig {
  apiKey: string;
  mcpUrl: string;
  apiUrl: string;
}

const DEV_HOST = /^(dev\.([a-z0-9-]+\.)*payit2\.com|localhost|127\.0\.0\.1)$/;

export function assertDevTarget(url: string): void {
  const host = new URL(url).hostname;
  if (!DEV_HOST.test(host)) {
    throw new Error(`Refusing to use ${host}: e2e tests write to dev hosts or localhost only.`);
  }
}

export function readKeychain(service: string): string | undefined {
  if (process.platform !== "darwin") return undefined;
  try {
    const value = execFileSync("security", ["find-generic-password", "-s", service, "-w"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  keychain: (service: string) => string | undefined = readKeychain,
): E2EConfig {
  const apiKey = env.E2E_FIXTURE_API_KEY || keychain(KEYCHAIN_SERVICE);
  if (!apiKey) {
    throw new Error(
      "E2E_FIXTURE_API_KEY is not set and the Keychain has no 'payit2-e2e-fixture-api-key' item. " +
        "Tests do not skip (PLATFORM-STANDARDS §3); see tests/README.md.",
    );
  }
  if (!/^pi2_(live|test)_/.test(apiKey)) {
    throw new Error("E2E_FIXTURE_API_KEY does not look like a PayIt2 key (expected a pi2_live_ or pi2_test_ prefix).");
  }
  const mcpUrl = env.E2E_MCP_URL || "https://dev.mcp.payit2.com/mcp";
  const apiUrl = env.E2E_API_URL || "https://dev.api.payit2.com";
  assertDevTarget(mcpUrl);
  assertDevTarget(apiUrl);
  return { apiKey, mcpUrl, apiUrl };
}
```

- [ ] **Step 6: Run the tests and the type check**

Run: `cd tests && npm test && npm run typecheck`
Expected: 7 tests PASS; `tsc` prints nothing.

- [ ] **Step 7: Commit**

```bash
git add tests/package.json tests/package-lock.json tests/tsconfig.json tests/vitest.config.ts tests/.gitignore tests/lib/env.ts tests/lib/env.unit.test.ts
git commit -m "test: add the e2e harness and the dev-only target guard"
```

---

### Task 2: Bundle the production connector and fix the hooks

**Files:**
- Create: `plugin/.mcp.json`, `plugin/scripts/session-start.sh`, `plugin/scripts/confirm-settings-change.sh`
- Modify: `plugin/.claude-plugin/plugin.json`, `plugin/hooks/hooks.json`
- Delete: `plugin/scripts/save-summary.sh`
- Test: `tests/plugin/plugin.unit.test.ts`

**Interfaces:**
- Produces: server name `payit2` at `https://mcp.payit2.com/mcp`; PreToolUse matcher `mcp__.*payit2.*__update_campaign_settings`. The live runner (Task 7) names its dev server `payit2` too, so its tools are `mcp__payit2__<tool>`.

- [ ] **Step 1: Write the failing test**

`tests/plugin/plugin.unit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PLUGIN = fileURLToPath(new URL("../../plugin/", import.meta.url));
const json = (rel: string) => JSON.parse(readFileSync(PLUGIN + rel, "utf8"));

describe("shipped plugin files", () => {
  it("bundles the production connector with no credentials", () => {
    expect(json(".mcp.json")).toEqual({
      mcpServers: { payit2: { type: "http", url: "https://mcp.payit2.com/mcp" } },
    });
  });

  it("asks for no API key", () => {
    expect(json(".claude-plugin/plugin.json").userConfig).toBeUndefined();
  });

  it("uses no prompt-type hooks, which Claude Code rejects or cannot ground", () => {
    const hooks = json("hooks/hooks.json").hooks as Record<string, Array<{ hooks: Array<{ type: string }> }>>;
    const types = Object.values(hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.type)));
    expect(types).not.toContain("prompt");
    expect(Object.keys(hooks).sort()).toEqual(["PreToolUse", "SessionStart", "UserPromptSubmit"]);
  });

  it("matches update_campaign_settings from the bundled, hand-added and e2e servers only", () => {
    const pre = json("hooks/hooks.json").hooks.PreToolUse[0];
    const matcher = new RegExp(pre.matcher);
    expect(matcher.test("mcp__plugin_payit2-campaign-assistant_payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_question")).toBe(false);
    expect(matcher.test("mcp__other__update_campaign_settings")).toBe(false);
  });

  it("confirm-settings-change.sh asks for approval", () => {
    const out = execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", { input: "{}", encoding: "utf8" });
    const parsed = JSON.parse(out);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toMatch(/organizer/i);
  });

  it("session-start.sh prints context and never mentions signing in", () => {
    const out = execFileSync(PLUGIN + "scripts/session-start.sh", { input: "{}", encoding: "utf8" });
    expect(out).toMatch(/list_my_campaigns/);
    expect(out).toMatch(/do not greet/i);
    expect(out).not.toMatch(/[—–]/);
  });

  it("drops the Stop hook's orphaned script", () => {
    expect(existsSync(PLUGIN + "scripts/save-summary.sh")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd tests && npm test`
Expected: the `shipped plugin files` tests FAIL (no `.mcp.json`, `userConfig` present, prompt hooks present).

- [ ] **Step 3: Add `plugin/.mcp.json`**

```json
{
  "mcpServers": {
    "payit2": {
      "type": "http",
      "url": "https://mcp.payit2.com/mcp"
    }
  }
}
```

- [ ] **Step 4: Edit `plugin/.claude-plugin/plugin.json`**

Delete the whole `"userConfig": { … }` block (and the comma before it) and set `"version": "1.7.0"`. Every other key stays as it is.

- [ ] **Step 5: Add the two hook scripts**

`plugin/scripts/session-start.sh`:
```bash
#!/bin/bash
# SessionStart hook. Plain stdout from a SessionStart command hook becomes context for Claude.
# Prompt-type hooks are not supported on SessionStart, so this replaces the old prompt hook.
cat > /dev/null
cat <<'EOF'
PayIt2 Campaign Assistant is installed. If PayIt2 tools such as list_my_campaigns are available in this session, the organizer is signed in to PayIt2. In that case, call list_my_campaigns once to find their active campaigns, and call get_campaign_health for any campaign past half its timeline or below 30% of its goal or capacity. Open your first reply with a short greeting of three to five lines that names any urgent campaign and its top recommendation. If they have no campaigns, greet them and suggest /campaign. If PayIt2 tools are not available, do not greet and do not mention PayIt2 sign-in at the start of the session.
EOF
```

`plugin/scripts/confirm-settings-change.sh`:
```bash
#!/bin/bash
# PreToolUse hook for update_campaign_settings. Always asks the organizer to approve the change:
# Claude Code shows its permission prompt with the new values. In a headless -p run nobody can
# answer, so the call is denied and Claude reads the reason.
cat > /dev/null
printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Changing campaign settings needs the organizer'"'"'s approval. Show each field'"'"'s current and new value before they approve."}}'
```

Run: `chmod +x plugin/scripts/session-start.sh plugin/scripts/confirm-settings-change.sh && git rm plugin/scripts/save-summary.sh`

- [ ] **Step 6: Replace `plugin/hooks/hooks.json`**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/session-start.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/detect-campaign-url.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "mcp__.*payit2.*__update_campaign_settings",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/confirm-settings-change.sh"
          }
        ]
      }
    ]
  }
}
```

The old `SubagentStart` and `Stop` hooks are removed. Both were prompt hooks that told the hook model to read the conversation, which a prompt hook never sees, and the Stop entry piped its output into a script, which is not a Claude Code feature.

- [ ] **Step 7: Run the tests and validate**

Run: `cd tests && npm test && cd .. && claude plugin validate plugin --strict`
Expected: all unit tests PASS; `✔ Validation passed`.

- [ ] **Step 8: Commit**

```bash
git add plugin/.mcp.json plugin/.claude-plugin/plugin.json plugin/hooks/hooks.json plugin/scripts/session-start.sh plugin/scripts/confirm-settings-change.sh tests/plugin/plugin.unit.test.ts
git commit -m "feat: bundle the production PayIt2 connector and repair the plugin hooks

The connector signs in with OAuth only, so the unused API-key setting goes.
SessionStart becomes a command hook (prompt hooks are rejected there).
PreToolUse asks the organizer to approve settings changes and matches the
plugin-prefixed tool name. SubagentStart and Stop never worked and are removed."
```

---

### Task 3: Copy: sign-in, light mention, confirmation, no false promises

**Files:**
- Modify: `plugin/skills/campaign-context/SKILL.md`, `plugin/skills/campaign/SKILL.md`, `plugin/skills/check-in/SKILL.md`, `plugin/skills/promote/SKILL.md`, `plugin/skills/engage/SKILL.md`, `plugin/agents/campaign-assistant.md`, `plugin/scripts/detect-campaign-url.sh`, `README.md`, `CHANGELOG.md`, `payit2-campaign-assistant.zip`
- Test: `tests/plugin/plugin.unit.test.ts` (extend)

- [ ] **Step 1: Add failing copy checks**

Append to `tests/plugin/plugin.unit.test.ts`:
```ts
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function textFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return textFiles(path);
    return /\.(md|sh|json)$/.test(name) ? [path] : [];
  });
}
const allText = () => textFiles(PLUGIN).map((f) => ({ f, t: readFileSync(f, "utf8") }));

describe("plugin copy", () => {
  it("never promises that saved content reaches the feed or the dashboard (D9)", () => {
    const bad = /(campaign(?:'s)? (?:update )?feed|show(?:s)? up in the organizer's dashboard|appear in the organizer's dashboard|notifies existing participants)/i;
    const hits = allText().filter(({ t }) => bad.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("no longer asks for an API key", () => {
    const hits = allText().filter(({ t }) => /API key/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("tells the organizer how to sign in exactly where the light mention lives", () => {
    const ctx = readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8");
    expect(ctx).toMatch(/once per conversation/i);
    expect(ctx).toMatch(/\/mcp/);
    expect(ctx).toMatch(/Connectors/);
  });

  it("states the confirm-before-changing rule in the skills (claude.ai chat ignores hooks)", () => {
    for (const rel of ["skills/campaign-context/SKILL.md", "skills/campaign/SKILL.md"]) {
      expect(readFileSync(PLUGIN + rel, "utf8")).toMatch(/current and new value/i);
    }
  });
});
```

Run: `cd tests && npm test`
Expected: the `plugin copy` tests FAIL and name the files that still carry the old copy.

- [ ] **Step 2: `campaign-context/SKILL.md`, Operating Modes**

Replace the `Standalone mode (no MCP)` bullet, the `MCP-connected mode` bullet and the `How to detect which mode you're in` paragraph with:

```markdown
- **Standalone mode.** The default. Works for anyone using this plugin in Claude, with or without a PayIt2 account. Gather context by asking the organizer directly. Generate content, recommendations, and copy they can paste into payit2.com. Every skill in this plugin has a complete standalone workflow.
- **Connected mode.** If the organizer has signed in to PayIt2 through the plugin's `payit2` connector, you also get live campaign data and can create and update campaigns directly. Content you generate (stories, thank-yous, update posts, improvement notes) can be saved to their PayIt2 account as a record with the `save_*` tools, but saved content does not appear on the campaign page, in the campaign's updates, or in their dashboard. Always hand the organizer the finished text to post or send themselves. Connected mode is an enhancement, not a requirement.

**How to detect which mode you're in:** check whether tools like `list_my_campaigns`, `get_campaign_overview`, or `create_campaign` are available in the current session. If they are, you're in connected mode. If not, use standalone mode.

**The one sign-in mention.** If the organizer asks about their own live numbers (amount raised, payments, participants, how their campaign is doing) and PayIt2 tools are not available, say once per conversation, in one or two sentences, that signing in to PayIt2 lets you pull those numbers automatically: in Claude Code, type `/mcp`, choose `payit2` and sign in; in claude.ai, connect PayIt2 under Connectors in Settings. Then carry on in standalone mode by asking for the numbers. Never mention sign-in at any other time, and never more than once per conversation.

**Before changing any campaign setting** (title, description, goal, end date, theme or colors), show the organizer each field's current and new value and wait for a clear yes. Claude Code also asks them to approve the change; claude.ai chat does not, so this rule is what protects them there.
```

In the `MCP-Enhanced Data Gathering` section, replace the closing paragraph (`If MCP is not available, skip this section entirely …`) with:

```markdown
If PayIt2 tools are not available, skip this section and use the manual context-gathering rules below, apart from the one sign-in mention described under Operating Modes.
```

In the Mutation tools table, replace the last row with:

```markdown
| Keep a record of a generated story, thank-you, update post or improvement notes (not shown on the campaign page or dashboard) | `save_campaign_story`, `save_thank_you`, `save_update_post`, `save_improvement_notes` |
```

- [ ] **Step 3: `campaign/SKILL.md`**

Replace the `MCP-connected` bullet and the line after the bullets (`If MCP tools aren't available …`) with:

```markdown
- **Connected:** Steps 1-7 stay the same, then Step 8 creates the campaign as a draft on the organizer's PayIt2 account with `create_campaign`. The full story goes in the campaign `description`, which is what the campaign page shows. Step 8 also attaches the cover image with `upload_campaign_image` and applies a theme with `update_campaign_settings`.

If PayIt2 tools aren't available in the session, run the standalone flow. See `campaign-context` for the one sign-in mention.
```

In `### MCP-Enhanced Flow`, replace step 5 (`**Save the campaign story.** …`) with:

```markdown
5. **Put the story on the page.** The campaign `description` is the story the campaign page shows. Make sure the final story from Step 3 is the `description` you passed to `create_campaign`; if the story changed after creation, show the organizer the current and new description and, after a clear yes, update it with `update_campaign_settings`. Then call `save_campaign_story` to keep a record. The saved copy does not appear on the page or in the dashboard.
```

Directly above the paragraph that begins `Apply the chosen preset by calling update_campaign_settings`, insert:

```markdown
   Before calling `update_campaign_settings`, show the organizer each field's current and new value and get a clear yes. Claude Code will also ask them to approve the call.
```

- [ ] **Step 4: `check-in/SKILL.md`**

Replace the `MCP-connected` bullet with:

```markdown
- **Connected:** pull live `get_campaign_health` and `get_payment_summary` data instead of asking. Give the organizer the action plan in your reply, and keep a record of it with `save_improvement_notes`. The saved notes do not appear in their dashboard.
```

Replace step 4 under `### AI-powered improvement plan` with:

```markdown
4. After the organizer reviews and approves the recommendations, call `save_improvement_notes` to keep a record of the action items. Tell the organizer the plan is in this conversation for them to keep; the saved copy is not shown in their dashboard.
```

- [ ] **Step 5: `promote/SKILL.md`**

Replace the `MCP-connected` bullet with:

```markdown
- **Connected:** the same package, with live progress numbers (`get_payment_summary`, `get_campaign_health`) woven into update posts. Update posts are handed to the organizer to post on their campaign page; `save_update_post` keeps a record but does not publish anything.
```

Replace item 2 under `## If the PayIt2 MCP server is connected` with:

```markdown
2. **Keep a record with `save_update_post`**: After generating an update post, give the organizer the finished text to post on their campaign page, then call `save_update_post(campaignId, content)` to keep a record. Saving does not publish the update or notify anyone.
```

Replace the second bullet under `**Enhanced workflow when MCP is connected:**` with:

```markdown
- Hand the organizer each finished update to post, and keep a record with `save_update_post`.
```

- [ ] **Step 6: `engage/SKILL.md`**

Replace the `MCP-connected` bullet and the line after it with:

```markdown
- **Connected:** pull live participant data, and keep a record of generated thank-yous and updates with the `save_*` tools. Saved content is not shown in the organizer's account, so always hand them the finished text to send or post.

If PayIt2 tools aren't available in the session, use the standalone flow. See `campaign-context` for the one sign-in mention.
```

Replace the `save_update_post` bullet under `**Persisting generated content:**` with:

```markdown
- Call `save_update_post(campaignId, content)` to keep a record of a generated update. It does not publish anything: give the organizer the text to post on their campaign page.
```

- [ ] **Step 7: Agent and URL hook**

In `plugin/agents/campaign-assistant.md`, replace the `**Operating modes:**` paragraph with:

```markdown
**Operating modes:** This agent works in two modes: standalone (default) and connected. In standalone mode, ask the organizer for current numbers and run the diagnostic against the benchmarks below; the analysis and action plan are just as rigorous, you simply gather data through conversation. In connected mode, pull live campaign data with the PayIt2 tools listed in step 1, give the organizer the action plan in your reply, and keep a record of it with `save_improvement_notes` (saved notes are not shown in their dashboard). Detect the mode by checking whether tools like `get_campaign_overview` are available. If they are not, follow the one sign-in mention rule in `campaign-context` and otherwise gather data by asking.
```

In `plugin/scripts/detect-campaign-url.sh`, replace the `echo` on line 18 with:

```bash
  echo "If PayIt2 tools are available, call get_campaign_overview with the slug or campaign ID to fetch live stats before responding. If they are not, ask the organizer for the current numbers; the skills work fine in standalone mode."
```

- [ ] **Step 8: README and CHANGELOG**

In `README.md`, replace the `**PayIt2-connected.**` bullet with:

```markdown
- **PayIt2-connected.** If you have a PayIt2 account, sign in once and Claude can pull your live campaign data and create or update campaigns directly. In Claude Code, type `/mcp`, choose `payit2` and sign in. In claude.ai or Claude Desktop, connect PayIt2 under Connectors in Settings. Same workflows, less copy-paste. Claude always asks before changing a campaign's settings.
```

In `CHANGELOG.md`, under `## [Unreleased]`, add above the existing `### Fixed`:

```markdown
### Added

- **The plugin now ships with the PayIt2 connector.** Organizers sign in to PayIt2 once
  (`/mcp` in Claude Code, Connectors in claude.ai) instead of pasting an API key. The unused
  API-key setting is gone.
- **End-to-end tests.** `tests/` holds a connector check that runs in CI against dev and a
  live run of the plugin with Claude. See `tests/README.md`.

### Changed

- **No more promises that saved content shows up on the campaign.** The connector's save tools
  keep a record only; nothing reads it yet. The skills now hand the organizer the finished
  text to post, and a campaign's story goes in its description, which the page shows.
- **When PayIt2 isn't connected, Claude mentions signing in once** if the organizer asks about
  their live numbers, then carries on without it.
```

and under the existing `### Fixed`, add:

```markdown
- **The startup greeting never ran.** Claude Code rejects prompt-type hooks on SessionStart.
  It is now a command hook.
- **The confirmation before changing campaign settings never fired.** Its matcher used the
  wrong tool name, and its prompt asked a hook model to read a conversation it never sees.
  It is now a command hook that asks the organizer to approve every settings change.
- **Two hooks that could not work are removed.** SubagentStart and Stop were prompt hooks that
  needed the conversation, and the Stop hook piped into a script, which hooks cannot do.
```

- [ ] **Step 9: Run checks, rebuild the zip**

Run: `cd tests && npm test && cd .. && grep -rn '—\|–' plugin/skills/campaign-context/SKILL.md | grep -i -E 'connected|sign|current and new' ; claude plugin validate plugin --strict && ./build-plugin.sh`
Expected: unit tests PASS; the grep prints nothing (no dashes in the new passages); validation passes; `Built payit2-campaign-assistant.zip`.

- [ ] **Step 10: Commit**

```bash
git add plugin README.md CHANGELOG.md payit2-campaign-assistant.zip tests/plugin/plugin.unit.test.ts
git commit -m "docs(plugin): sign-in copy, the one sign-in mention, and no feed or dashboard promises

Saved content goes to a table nothing reads (spec D9), so the skills hand
organizers the text to post and put the story in the campaign description.
The confirm-before-changing rule is in the skills because claude.ai chat
ignores hooks."
```

---

### Task 4: Parsers and the plugin's tool references

**Files:**
- Create: `tests/lib/parse.ts`, `tests/lib/references.ts`
- Test: `tests/lib/parse.unit.test.ts`, `tests/lib/references.unit.test.ts`

**Interfaces:**
- Produces: `parseRaised(text: string): { raised: number; goal: number }`, `parseField(text: string, label: string): string`, `collectReferences(pluginDir: string): Map<string, string[]>` (name to files relative to `pluginDir`), `NON_TOOL_TOKENS: Set<string>`.

- [ ] **Step 1: Write the failing tests**

`tests/lib/parse.unit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseField, parseRaised } from "./parse.js";

const overview = [
  "## Campaign: Spring Fund",
  "",
  "**ID:** cmp_123",
  "**Status:** draft",
  "### Fundraising Progress",
  "**Raised:** $1,250 of $15,000 goal",
].join("\n");

describe("parse", () => {
  it("reads raised and goal from overview and health lines", () => {
    expect(parseRaised(overview)).toEqual({ raised: 1250, goal: 15000 });
    expect(parseRaised("**Raised:** $0 of $5,000 goal (0.0%)")).toEqual({ raised: 0, goal: 5000 });
  });
  it("reads labelled fields", () => {
    expect(parseField(overview, "ID")).toBe("cmp_123");
    expect(parseField(overview, "Status")).toBe("draft");
  });
  it("names the missing label", () => {
    expect(() => parseField(overview, "Goal")).toThrow(/Goal/);
    expect(() => parseRaised("nothing")).toThrow(/Raised/);
  });
});
```

`tests/lib/references.unit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectReferences } from "./references.js";

function fakePlugin(): string {
  const dir = mkdtempSync(join(tmpdir(), "refs-"));
  mkdirSync(join(dir, "skills", "a"), { recursive: true });
  mkdirSync(join(dir, "hooks"));
  writeFileSync(join(dir, "skills", "a", "SKILL.md"),
    "Call `get_campaign_health` then `save_update_post(campaignId, content)`. Use `pick_any` groups. Not a tool: `/mcp`.");
  writeFileSync(join(dir, "hooks", "hooks.json"),
    JSON.stringify({ matcher: "mcp__.*payit2.*__update_campaign_settings" }));
  return dir;
}

describe("collectReferences", () => {
  it("finds backticked names, call-style names and hook matcher names", () => {
    const refs = collectReferences(fakePlugin());
    expect([...refs.keys()].sort()).toEqual(["get_campaign_health", "save_update_post", "update_campaign_settings"]);
    expect(refs.get("update_campaign_settings")).toEqual(["hooks/hooks.json"]);
  });
});
```

Run: `cd tests && npm test`
Expected: FAIL, modules not found.

- [ ] **Step 2: Implement `tests/lib/parse.ts`**

```ts
const amount = (s: string) => Number(s.replace(/,/g, ""));

export function parseRaised(text: string): { raised: number; goal: number } {
  const m = text.match(/\*\*Raised:\*\* \$([\d,]+(?:\.\d+)?) of \$([\d,]+(?:\.\d+)?) goal/);
  if (!m) throw new Error(`No "Raised" line in tool output:\n${text}`);
  return { raised: amount(m[1]), goal: amount(m[2]) };
}

export function parseField(text: string, label: string): string {
  const m = text.match(new RegExp(`\\*\\*${label}:\\*\\* (.+)`));
  if (!m) throw new Error(`No "${label}" line in tool output:\n${text}`);
  return m[1].trim();
}
```

- [ ] **Step 3: Implement `tests/lib/references.ts`**

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Backticked snake_case words in the plugin that are option or question types, not tools.
export const NON_TOOL_TOKENS = new Set(["multi_select", "pick_any"]);

const BACKTICKED = /`([a-z]+(?:_[a-z]+)+)(?:\([^`]*\))?`/g;
const MCP_NAME = /mcp__[A-Za-z0-9_.*-]*?__([a-z]+(?:_[a-z]+)+)/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function collectReferences(pluginDir: string): Map<string, string[]> {
  const refs = new Map<string, string[]>();
  for (const file of walk(pluginDir).filter((f) => /\.(md|json|sh)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    const rel = relative(pluginDir, file);
    const add = (name: string) => {
      if (NON_TOOL_TOKENS.has(name)) return;
      const files = refs.get(name) ?? [];
      if (!files.includes(rel)) files.push(rel);
      refs.set(name, files);
    };
    for (const m of text.matchAll(BACKTICKED)) add(m[1]);
    for (const m of text.matchAll(MCP_NAME)) add(m[1]);
  }
  return refs;
}
```

- [ ] **Step 4: Run tests and type check**

Run: `cd tests && npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/parse.ts tests/lib/references.ts tests/lib/parse.unit.test.ts tests/lib/references.unit.test.ts
git commit -m "test: parse connector output and collect the plugin's tool references"
```

---

### Task 5: Layer 1, the connector check against dev

**Precondition:** the fixture organizer's dev key is in the Keychain item `payit2-e2e-fixture-api-key` (Brian, done interactively) and `curl` against dev returns 200 (see Step 1).

**Files:**
- Create: `tests/lib/mcp.ts`, `tests/lib/api.ts`, `tests/lib/fixture.ts`, `tests/connector/drift.connector.test.ts`, `tests/connector/reads.connector.test.ts`, `tests/connector/writes.connector.test.ts`, `tests/connector/auth.connector.test.ts`, `tests/README.md`

**Interfaces:**
- Consumes: `loadConfig`, `E2EConfig` (Task 1); `parseRaised`, `parseField`, `collectReferences` (Task 4).
- Produces: `connectMcp(cfg): Promise<Mcp>` with `Mcp { client: Client; callText(name, args): Promise<string>; close(): Promise<void> }`; `DevApi` with `getCampaign(id): Promise<CampaignDetail | null>`, `listMyCampaigns(search?): Promise<CampaignSummary[]>`, `listPayments(id): Promise<unknown[]>`, `deletePermanent(id): Promise<void>`; `toNumber(v)`; `FIXTURE_TITLE`, `MARKER_PREFIX`, `runMarker(date?)`, `ensureFixtureCampaign(mcp, api): Promise<string>`, `sweepLeftovers(api): Promise<string[]>`.

- [ ] **Step 1: Confirm the key works, without printing it**

Run:
```bash
k="$(security find-generic-password -s payit2-e2e-fixture-api-key -w)"; curl -s -o /dev/null -w '%{http_code}\n' https://dev.api.payit2.com/api/v1/campaigns -H "x-api-key: $k"; unset k
```
Expected: `200`. On `401`, stop: the Keychain item does not hold the dev key.

- [ ] **Step 2: Implement `tests/lib/mcp.ts`**

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { E2EConfig } from "./env.js";

export interface Mcp {
  client: Client;
  callText(name: string, args: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}

export async function connectMcp(cfg: Pick<E2EConfig, "mcpUrl" | "apiKey">): Promise<Mcp> {
  const client = new Client({ name: "payit2-campaign-assistant-e2e", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(cfg.mcpUrl), {
    requestInit: { headers: { "x-api-key": cfg.apiKey } },
  });
  await client.connect(transport);
  return {
    client,
    async callText(name, args) {
      const res = await client.callTool({ name, arguments: args });
      const parts = (res.content ?? []) as Array<{ type: string; text?: string }>;
      const text = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n");
      if (res.isError) throw new Error(`${name} returned an error: ${text}`);
      return text;
    },
    close: () => client.close(),
  };
}
```

- [ ] **Step 3: Implement `tests/lib/api.ts`**

```ts
import type { E2EConfig } from "./env.js";

export interface CampaignDetail {
  id: string;
  title: string;
  status: string;
  goalAmount: number | string | null;
  totalRaised: number | string | null;
  description: string | null;
  themeId: string | null;
  role: string;
}
export interface CampaignSummary { id: string; title: string; status: string }

export const toNumber = (v: number | string | null | undefined): number => (v == null ? 0 : Number(v));

export class DevApi {
  constructor(private readonly cfg: Pick<E2EConfig, "apiUrl" | "apiKey">) {}

  private async request(method: string, path: string): Promise<Response> {
    return fetch(`${this.cfg.apiUrl}${path}`, { method, headers: { "x-api-key": this.cfg.apiKey } });
  }

  private async json<T>(method: string, path: string): Promise<T> {
    const res = await this.request(method, path);
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async getCampaign(id: string): Promise<CampaignDetail | null> {
    const res = await this.request("GET", `/api/v1/campaigns/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET campaign ${id}: ${res.status} ${await res.text()}`);
    return (await res.json()) as CampaignDetail;
  }

  async listMyCampaigns(search?: string): Promise<CampaignSummary[]> {
    const q = new URLSearchParams({ pageSize: "100" });
    if (search) q.set("search", search);
    const body = await this.json<unknown>("GET", `/api/v1/campaigns?${q}`);
    const b = body as Record<string, unknown>;
    const list = Array.isArray(body) ? body : (b.campaigns ?? b.data ?? b.items);
    if (!Array.isArray(list)) {
      throw new Error(`Unexpected campaign list shape, keys: ${Object.keys(b).join(", ")}`);
    }
    return list as CampaignSummary[];
  }

  async listPayments(id: string): Promise<unknown[]> {
    return this.json<unknown[]>("GET", `/api/v1/campaigns/${id}/payments`);
  }

  async deletePermanent(id: string): Promise<void> {
    const res = await this.request("DELETE", `/api/v1/campaigns/${id}/permanent`);
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`DELETE campaign ${id} permanently: ${res.status} ${await res.text()}`);
    }
  }
}
```

If Step 7's first run fails with `Unexpected campaign list shape`, read the printed keys, add that key to the `list` fallback chain, and rerun. Do not loosen anything else.

- [ ] **Step 4: Implement `tests/lib/fixture.ts`**

```ts
import type { Mcp } from "./mcp.js";
import type { DevApi } from "./api.js";
import { parseField } from "./parse.js";

export const FIXTURE_TITLE = "Campaign Assistant e2e fixture";
export const MARKER_PREFIX = "[e2e ";

export function runMarker(now: Date = new Date()): string {
  return `[e2e ${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}]`;
}

export async function ensureFixtureCampaign(mcp: Mcp, api: DevApi): Promise<string> {
  const found = (await api.listMyCampaigns(FIXTURE_TITLE)).find((c) => c.title === FIXTURE_TITLE);
  if (found) return found.id;
  const text = await mcp.callText("create_campaign", {
    title: FIXTURE_TITLE,
    mode: "fundraiser",
    description: "Standing fixture for the Campaign Assistant end-to-end tests. Do not delete.",
    goalAmount: 5000,
    publish: false,
  });
  return parseField(text, "ID");
}

export async function sweepLeftovers(api: DevApi): Promise<string[]> {
  const leftovers = (await api.listMyCampaigns(MARKER_PREFIX)).filter((c) => c.title.startsWith(MARKER_PREFIX));
  for (const c of leftovers) await api.deletePermanent(c.id);
  return leftovers.map((c) => c.id);
}
```

- [ ] **Step 5: Write the connector tests**

`tests/connector/drift.connector.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { collectReferences } from "../lib/references.js";

const PLUGIN = fileURLToPath(new URL("../../plugin", import.meta.url));
let mcp: Mcp;

beforeAll(async () => { mcp = await connectMcp(loadConfig()); });
afterAll(async () => { await mcp?.close(); });

describe("plugin and dev server agree", () => {
  it("every tool or prompt the plugin names exists on the server", async () => {
    const tools = (await mcp.client.listTools()).tools.map((t) => t.name);
    const prompts = (await mcp.client.listPrompts()).prompts.map((p) => p.name);
    const known = new Set([...tools, ...prompts]);
    const refs = collectReferences(PLUGIN);
    expect(refs.size).toBeGreaterThan(15);
    const missing = [...refs]
      .filter(([name]) => !known.has(name))
      .map(([name, files]) => `${name} (in ${files.join(", ")})`);
    expect(missing, "names the plugin uses that the server does not have").toEqual([]);
  });
});
```

`tests/connector/reads.connector.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { DevApi, toNumber } from "../lib/api.js";
import { ensureFixtureCampaign } from "../lib/fixture.js";
import { parseField, parseRaised } from "../lib/parse.js";

let mcp: Mcp;
let api: DevApi;
let id: string;

beforeAll(async () => {
  const cfg = loadConfig();
  mcp = await connectMcp(cfg);
  api = new DevApi(cfg);
  id = await ensureFixtureCampaign(mcp, api);
});
afterAll(async () => { await mcp?.close(); });

describe("read tools report what dev's API reports", () => {
  it("list_my_campaigns includes the fixture campaign", async () => {
    expect(await mcp.callText("list_my_campaigns", { filter: "all" })).toContain(`(${id})`);
  });

  it("get_campaign_overview matches the campaign record", async () => {
    const text = await mcp.callText("get_campaign_overview", { campaignId: id });
    const detail = (await api.getCampaign(id))!;
    expect(detail.role).toBe("owner");
    expect(parseField(text, "Status")).toBe(detail.status);
    expect(parseRaised(text)).toEqual({ raised: toNumber(detail.totalRaised), goal: toNumber(detail.goalAmount) });
  });

  it("get_campaign_health matches the campaign record", async () => {
    const text = await mcp.callText("get_campaign_health", { campaignId: id });
    const detail = (await api.getCampaign(id))!;
    expect(parseRaised(text)).toEqual({ raised: toNumber(detail.totalRaised), goal: toNumber(detail.goalAmount) });
  });

  it("get_payment_summary counts the same payments", async () => {
    const text = await mcp.callText("get_payment_summary", { campaignId: id });
    const payments = await api.listPayments(id);
    const m = text.match(/\*\*Total Payments:\*\* (\d+)/);
    expect(m ? Number(m[1]) : 0).toBe(payments.length);
  });
});
```

`tests/connector/writes.connector.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { DevApi, toNumber } from "../lib/api.js";
import { ensureFixtureCampaign, runMarker, sweepLeftovers } from "../lib/fixture.js";
import { parseField } from "../lib/parse.js";

let mcp: Mcp;
let api: DevApi;
let fixtureId: string;
const marker = runMarker();

beforeAll(async () => {
  const cfg = loadConfig();
  mcp = await connectMcp(cfg);
  api = new DevApi(cfg);
  await sweepLeftovers(api);
  fixtureId = await ensureFixtureCampaign(mcp, api);
});
afterAll(async () => {
  await sweepLeftovers(api);
  await mcp?.close();
});

describe("write tools change dev the way they say", () => {
  it("create_campaign makes a draft that the API returns, and it can be hard-deleted", async () => {
    const title = `${marker} connector write check`;
    const description = "Created by the Campaign Assistant connector check. Deleted at the end of the run.";
    const text = await mcp.callText("create_campaign", {
      title, mode: "fundraiser", description, goalAmount: 1234, publish: false,
    });
    const id = parseField(text, "ID");
    try {
      expect(parseField(text, "Status")).toBe("draft");
      const detail = (await api.getCampaign(id))!;
      expect(detail).toMatchObject({ title, status: "draft", role: "owner", description });
      expect(toNumber(detail.goalAmount)).toBe(1234);
    } finally {
      await api.deletePermanent(id);
    }
    expect(await api.getCampaign(id)).toBeNull();
  });

  it("save_update_post reports a saved record", async () => {
    const text = await mcp.callText("save_update_post", {
      campaignId: fixtureId,
      content: `${marker} connector check update. Saved as a record only.`,
    });
    expect(text).toMatch(new RegExp(`^Saved update_post content for campaign ${fixtureId}\\.`));
  });
});
```

`tests/connector/auth.connector.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { loadConfig } from "../lib/env.js";

const bundled = JSON.parse(readFileSync(new URL("../../plugin/.mcp.json", import.meta.url), "utf8"));
const PROD_URL: string = bundled.mcpServers.payit2.url;

describe("sign-in path", () => {
  it("dev answers an unauthenticated call with an OAuth challenge", async () => {
    const { mcpUrl } = loadConfig();
    const res = await fetch(mcpUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate") ?? "").toMatch(/resource_metadata="https:\/\/dev\.mcp\.payit2\.com\/\.well-known\/oauth-protected-resource"/);
  });
});

describe("the URL the plugin ships (production, no credentials)", () => {
  it("is up", async () => {
    const res = await fetch(new URL("/health", PROD_URL));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });
  it("is the resource production's OAuth metadata names", async () => {
    const res = await fetch(new URL("/.well-known/oauth-protected-resource", PROD_URL));
    expect(res.status).toBe(200);
    expect((await res.json()).resource).toBe(PROD_URL);
  });
});
```

- [ ] **Step 6: Write `tests/README.md`**

```markdown
---
title: "Campaign Assistant tests"
type: reference
doc_status: active
owner: claude-maintained
---
# Campaign Assistant tests

Three suites, all against dev. Nothing here writes to production.

| Command | What it runs | Needs |
|---|---|---|
| `npm test` | Offline checks of the plugin files and the test helpers | Nothing |
| `npm run connector` | Layer 1: the plugin's tools exist on dev, read tools match dev's API, a draft campaign round trip, the sign-in challenge, and the production URL (unauthenticated) | The fixture organizer's dev key |
| `npm run live` | Layer 2: headless Claude runs the plugin against dev in five scenarios | The dev key and a Claude token |

## Keys

The dev key belongs to the fixture organizer (`payit2/dev/e2e-fixture-organizer`). The tests read
`E2E_FIXTURE_API_KEY`, or on a Mac the Keychain item `payit2-e2e-fixture-api-key`:

    security add-generic-password -U -a "$USER" -s payit2-e2e-fixture-api-key -w

CI reads the `E2E_FIXTURE_API_KEY` Actions secret.

The live run uses a throwaway home folder so your own plugins and MCP servers stay out of it,
which also hides your Claude login. Give it a token instead: run `claude setup-token`, then

    security add-generic-password -U -a "$USER" -s payit2-e2e-claude-token -w

(or set `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`).

## Test data

Every write carries a run marker such as `[e2e 20261027T1530]`. Campaigns created by a run are
hard-deleted at the end, and each run first removes leftovers from crashed runs. The fixture
campaign `Campaign Assistant e2e fixture` is a standing draft that the tests reuse.
```

- [ ] **Step 7: Run Layer 1 against dev**

Run: `cd tests && npm run connector`
Expected: 10 tests PASS (drift 1, reads 4, writes 2, auth 3). If `get_payment_summary` or `list_my_campaigns` needs a different argument name, the error names it; fix the test call, not the assertion.

- [ ] **Step 8: Type check and commit**

```bash
cd tests && npm run typecheck && cd ..
git add tests/lib/mcp.ts tests/lib/api.ts tests/lib/fixture.ts tests/connector tests/README.md
git commit -m "test: layer 1 connector check against dev

Drift between plugin and server, read tools against dev's API, a draft
campaign round trip with hard delete, the save tool's record, the OAuth
challenge, and the production URL the plugin ships."
```

---

### Task 6: CI for Layer 1

**Precondition:** the `E2E_FIXTURE_API_KEY` Actions secret exists **on the repo**, not the org (§4: no org-level shared secrets). Check by name only: `gh secret list -R PayIt2/payit2-campaign-assistant | grep E2E_FIXTURE_API_KEY`, and `gh secret list --org PayIt2 | grep E2E_FIXTURE_API_KEY` must print nothing. If the repo secret is missing, Brian runs `security find-generic-password -s payit2-e2e-fixture-api-key -w | gh secret set E2E_FIXTURE_API_KEY -R PayIt2/payit2-campaign-assistant`. (On 2026-10-27 it was first created at org level with visibility `ALL`, which also exposed it to the public repos; Brian moves it.)

**Files:**
- Create: `.github/workflows/connector.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Connector check

on:
  pull_request:
    paths:
      - "plugin/**"
      - "tests/**"
      - ".github/workflows/connector.yml"
  workflow_dispatch:
  schedule:
    # Mondays 13:00 UTC. Catches a tool renamed in app-v2, which no plugin PR would trigger.
    - cron: "0 13 * * 1"

concurrency:
  group: connector-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  connector:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: tests
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: tests/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - name: Connector check against dev
        run: npm run connector
        env:
          E2E_FIXTURE_API_KEY: ${{ secrets.E2E_FIXTURE_API_KEY }}
      - name: Validate the plugin
        working-directory: .
        run: npx --yes @anthropic-ai/claude-code@2.1.252 plugin validate plugin --strict
```

- [ ] **Step 2: Lint the workflow locally**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/connector.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/connector.yml
git commit -m "ci: run the connector check, unit tests and plugin validation"
```

The workflow's first green run happens on PR 1 (Task 10).

---

### Task 7: Layer 2 plumbing: stream parser and isolated runs

**Precondition:** a Claude token in the Keychain item `payit2-e2e-claude-token` (Brian: `claude setup-token`, then the `security` command in `tests/README.md`), or `ANTHROPIC_API_KEY` in the environment.

**Files:**
- Create: `tests/live/stream.ts`, `tests/live/claude.ts`
- Test: `tests/live/stream.unit.test.ts`

**Interfaces:**
- Produces: `parseStream(jsonl: string): StreamSummary` where
  `StreamSummary { init: InitInfo | null; toolUses: ToolUse[]; toolResults: ToolResult[]; hooks: HookEvent[]; denials: string[]; resultText: string; isError: boolean; costUsd: number }`,
  `InitInfo { plugins: string[]; mcpServers: { name: string; status: string }[]; tools: string[]; version: string }`,
  `ToolUse { id: string; name: string; input: Record<string, unknown> }`, `ToolResult { toolUseId: string; text: string; isError: boolean }`, `HookEvent { event: string; name: string; outcome: string; output: string }`.
  `runClaude(o: RunOptions): Promise<{ jsonl: string; stderr: string; exitCode: number }>` with
  `RunOptions { name: string; prompt: string; pluginDir: string; outDir: string; mcpConfig?: object; maxTurns: number; maxBudgetUsd: number; model: string; auth: { CLAUDE_CODE_OAUTH_TOKEN?: string; ANTHROPIC_API_KEY?: string } }`.

- [ ] **Step 1: Write the failing parser test**

`tests/live/stream.unit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseStream } from "./stream.js";

const lines = [
  { type: "system", subtype: "hook_response", hook_event: "SessionStart", hook_name: "SessionStart:startup", outcome: "success", output: "" },
  {
    type: "system", subtype: "init", claude_code_version: "2.1.252",
    plugins: [{ name: "payit2-campaign-assistant", path: "/x", source: "payit2-campaign-assistant@inline", version: "1.7.0" }],
    mcp_servers: [{ name: "payit2", status: "connected" }],
    tools: ["Read", "mcp__payit2__get_campaign_health"],
  },
  { type: "assistant", message: { content: [
    { type: "text", text: "Checking." },
    { type: "tool_use", id: "t1", name: "mcp__payit2__get_campaign_health", input: { campaignId: "c1" } },
  ] } },
  { type: "user", message: { content: [
    { type: "tool_result", tool_use_id: "t1", content: [{ type: "text", text: "**Raised:** $0 of $5,000 goal (0.0%)" }] },
  ] } },
  { type: "system", subtype: "hook_response", hook_event: "PreToolUse", hook_name: "PreToolUse:mcp__payit2__update_campaign_settings", outcome: "success", output: "{}" },
  { type: "result", subtype: "success", result: "Your goal is $5,000.", is_error: false, total_cost_usd: 0.12,
    permission_denials: [{ tool_name: "mcp__payit2__update_campaign_settings", tool_use_id: "t2", tool_input: {} }] },
].map((l) => JSON.stringify(l)).join("\n");

describe("parseStream", () => {
  it("collects init, tool calls, results, hooks, denials and the final reply", () => {
    const s = parseStream(lines + "\nnot json\n");
    expect(s.init).toEqual({
      plugins: ["payit2-campaign-assistant"],
      mcpServers: [{ name: "payit2", status: "connected" }],
      tools: ["Read", "mcp__payit2__get_campaign_health"],
      version: "2.1.252",
    });
    expect(s.toolUses).toEqual([{ id: "t1", name: "mcp__payit2__get_campaign_health", input: { campaignId: "c1" } }]);
    expect(s.toolResults).toEqual([{ toolUseId: "t1", text: "**Raised:** $0 of $5,000 goal (0.0%)", isError: false }]);
    expect(s.hooks.map((h) => h.event)).toEqual(["SessionStart", "PreToolUse"]);
    expect(s.denials).toEqual(["mcp__payit2__update_campaign_settings"]);
    expect(s.resultText).toBe("Your goal is $5,000.");
    expect(s.costUsd).toBe(0.12);
  });
});
```

Run: `cd tests && npm test`
Expected: FAIL, module not found.

- [ ] **Step 2: Implement `tests/live/stream.ts`**

```ts
export interface InitInfo { plugins: string[]; mcpServers: { name: string; status: string }[]; tools: string[]; version: string }
export interface ToolUse { id: string; name: string; input: Record<string, unknown> }
export interface ToolResult { toolUseId: string; text: string; isError: boolean }
export interface HookEvent { event: string; name: string; outcome: string; output: string }
export interface StreamSummary {
  init: InitInfo | null;
  toolUses: ToolUse[];
  toolResults: ToolResult[];
  hooks: HookEvent[];
  denials: string[];
  resultText: string;
  isError: boolean;
  costUsd: number;
}

type Block = { type: string; [k: string]: unknown };

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as Block[]).filter((b) => b.type === "text").map((b) => String(b.text ?? "")).join("\n");
}

export function parseStream(jsonl: string): StreamSummary {
  const s: StreamSummary = { init: null, toolUses: [], toolResults: [], hooks: [], denials: [], resultText: "", isError: false, costUsd: 0 };
  for (const line of jsonl.split("\n")) {
    let e: Record<string, any>;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type === "system" && e.subtype === "init") {
      s.init = {
        plugins: (e.plugins ?? []).map((p: { name: string }) => p.name),
        mcpServers: (e.mcp_servers ?? []).map((m: { name: string; status: string }) => ({ name: m.name, status: m.status })),
        tools: e.tools ?? [],
        version: e.claude_code_version ?? "",
      };
    } else if (e.type === "system" && e.subtype === "hook_response") {
      s.hooks.push({ event: e.hook_event ?? "", name: e.hook_name ?? "", outcome: e.outcome ?? "", output: e.output ?? "" });
    } else if (e.type === "assistant") {
      for (const b of (e.message?.content ?? []) as Block[]) {
        if (b.type === "tool_use") s.toolUses.push({ id: String(b.id), name: String(b.name), input: (b.input ?? {}) as Record<string, unknown> });
      }
    } else if (e.type === "user") {
      for (const b of (e.message?.content ?? []) as Block[]) {
        if (b.type === "tool_result") s.toolResults.push({ toolUseId: String(b.tool_use_id), text: blockText(b.content), isError: Boolean(b.is_error) });
      }
    } else if (e.type === "result") {
      s.resultText = String(e.result ?? "");
      s.isError = Boolean(e.is_error);
      s.costUsd = Number(e.total_cost_usd ?? 0);
      s.denials = (e.permission_denials ?? []).map((d: { tool_name: string }) => d.tool_name);
    }
  }
  return s;
}
```

- [ ] **Step 3: Implement `tests/live/claude.ts`**

```ts
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunOptions {
  name: string;
  prompt: string;
  pluginDir: string;
  outDir: string;
  mcpConfig?: object;
  maxTurns: number;
  maxBudgetUsd: number;
  model: string;
  auth: { CLAUDE_CODE_OAUTH_TOKEN?: string; ANTHROPIC_API_KEY?: string };
}

// Runs `claude -p` with a throwaway HOME and working folder, so only the plugin under test
// (and, when given, the dev connector) loads. The MCP config holds the dev key, so it lives
// in the throwaway folder with mode 0600 and is deleted afterwards.
export async function runClaude(o: RunOptions): Promise<{ jsonl: string; stderr: string; exitCode: number }> {
  const scratch = mkdtempSync(join(tmpdir(), "payit2-e2e-"));
  const home = join(scratch, "home");
  const cwd = join(scratch, "cwd");
  mkdirSync(home);
  mkdirSync(cwd);
  const args = [
    "-p", o.prompt,
    "--plugin-dir", o.pluginDir,
    "--output-format", "stream-json", "--verbose", "--include-hook-events",
    "--permission-mode", "dontAsk",
    "--model", o.model,
    "--max-turns", String(o.maxTurns),
    "--max-budget-usd", String(o.maxBudgetUsd),
  ];
  if (o.mcpConfig) {
    const path = join(scratch, "mcp.json");
    writeFileSync(path, JSON.stringify(o.mcpConfig), { mode: 0o600 });
    args.push("--mcp-config", path, "--strict-mcp-config", "--allowedTools", "mcp__payit2");
  }
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "",
    HOME: home,
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    LANG: "en_US.UTF-8",
    ...o.auth,
  };
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn("claude", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
      let jsonl = "";
      let stderr = "";
      child.stdout.on("data", (d) => { jsonl += d; });
      child.stderr.on("data", (d) => { stderr += d; });
      child.on("error", reject);
      child.on("close", (code) => {
        writeFileSync(join(o.outDir, `${o.name}.jsonl`), jsonl);
        resolve({ jsonl, stderr, exitCode: code ?? -1 });
      });
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
```

- [ ] **Step 4: Run tests and type check**

Run: `cd tests && npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Probe one isolated run by hand**

Create `tests/live/probe.ts` temporarily:
```ts
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { runClaude } from "./claude.js";
import { parseStream } from "./stream.js";
import { readKeychain, CLAUDE_TOKEN_SERVICE } from "../lib/env.js";

const out = fileURLToPath(new URL("./.runs/probe", import.meta.url));
mkdirSync(out, { recursive: true });
const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || readKeychain(CLAUDE_TOKEN_SERVICE);
const r = await runClaude({
  name: "probe", prompt: "Reply with the single word ok.", pluginDir: fileURLToPath(new URL("../../plugin", import.meta.url)),
  outDir: out, maxTurns: 1, maxBudgetUsd: 0.2, model: "haiku",
  auth: token ? { CLAUDE_CODE_OAUTH_TOKEN: token } : { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
});
const s = parseStream(r.jsonl);
console.log(JSON.stringify({ exit: r.exitCode, init: s.init, hooks: s.hooks.map((h) => `${h.event}:${h.outcome}`), result: s.resultText, isError: s.isError }, null, 2));
```
Run: `cd tests && npx tsx live/probe.ts`
Expected: `plugins` is exactly `["payit2-campaign-assistant"]`; `mcpServers` is exactly the plugin's `plugin:payit2-campaign-assistant:payit2`; the SessionStart hook outcome is `success`; `result` is `ok`; `isError` false.

If `isError` is true with `Not logged in`, the token did not reach the run: check the Keychain item, and stop until it works. If you cannot get a token, fall back for this repo only by removing `HOME: home` from the env and adding `"--setting-sources", "project"` to `args`; then the init check in Task 8 must also accept the developer's own MCP servers and scenario 4 runs with `--strict-mcp-config` and an empty MCP config. Write down which mode you used in the PR description.

Delete `tests/live/probe.ts` afterwards.

- [ ] **Step 6: Commit**

```bash
git add tests/live/stream.ts tests/live/claude.ts tests/live/stream.unit.test.ts
git commit -m "test: parse headless Claude output and run the plugin in an isolated home"
```

---

### Task 8: Layer 2 scenarios and the first green live run

**Files:**
- Create: `tests/live/scenarios.ts`, `tests/live/run.ts`

**Interfaces:**
- Consumes: everything from Tasks 1, 4, 5 and 7.
- Produces: `npm run live [scenario names…]`, exit code 0 only when every selected scenario passes; `tests/live/.runs/<timestamp>/summary.json`.

- [ ] **Step 1: Write `tests/live/scenarios.ts`**

```ts
import type { DevApi } from "../lib/api.js";
import { toNumber } from "../lib/api.js";
import { FIXTURE_TITLE } from "../lib/fixture.js";
import type { StreamSummary } from "./stream.js";

export interface Ctx { fixtureId: string; marker: string; api: DevApi }
export interface Scenario {
  name: string;
  connector: "dev" | "none";
  maxTurns: number;
  maxBudgetUsd: number;
  prompt(ctx: Ctx): string;
  check(s: StreamSummary, ctx: Ctx): Promise<string[]>;
}

const tool = (name: string) => `mcp__payit2__${name}`;
const calls = (s: StreamSummary, name: string) => s.toolUses.filter((u) => u.name === tool(name));
const resultFor = (s: StreamSummary, id: string) => s.toolResults.find((r) => r.toolUseId === id);
const NOT_HERE = "The organizer is not available to answer questions; use what the tools return and finish.";

export const SCENARIOS: Scenario[] = [
  {
    name: "check-in",
    connector: "dev",
    maxTurns: 15,
    maxBudgetUsd: 1.5,
    prompt: ({ fixtureId }) =>
      `/payit2-campaign-assistant:check-in My campaign ID is ${fixtureId}. Run my weekly check-in with my live numbers. ${NOT_HERE}`,
    async check(s, { fixtureId, api }) {
      const f: string[] = [];
      if (calls(s, "get_campaign_health").length === 0) f.push("get_campaign_health was not called");
      const goal = toNumber((await api.getCampaign(fixtureId))!.goalAmount).toLocaleString("en-US");
      if (!s.resultText.includes(goal)) f.push(`reply does not state the goal dev reports ($${goal})`);
      return f;
    },
  },
  {
    name: "update-draft",
    connector: "dev",
    maxTurns: 15,
    maxBudgetUsd: 1.5,
    prompt: ({ fixtureId, marker }) =>
      `/payit2-campaign-assistant:engage My campaign ID is ${fixtureId}. Write a short progress update for my supporters and save it. Put this exact tag on its own line in the update: ${marker}. ${NOT_HERE}`,
    async check(s, { marker }) {
      const f: string[] = [];
      const saves = calls(s, "save_update_post").filter((u) => String(u.input.content ?? "").includes(marker));
      if (saves.length === 0) f.push("save_update_post was not called with the marker");
      else if (!resultFor(s, saves[0].id)?.text.startsWith("Saved update_post content")) f.push("save_update_post did not report a saved record");
      if (!s.resultText.includes(marker)) f.push("reply does not give the organizer the update text with the marker");
      if (/(posted|published|is live) (?:it )?(?:to|on) (?:your|the) (?:campaign(?:'s)? )?(?:update )?(?:feed|page)/i.test(s.resultText)) {
        f.push("reply claims the update was posted to the campaign");
      }
      return f;
    },
  },
  {
    name: "settings-confirmation",
    connector: "dev",
    maxTurns: 10,
    maxBudgetUsd: 1,
    prompt: ({ fixtureId, marker }) =>
      `My PayIt2 campaign ID is ${fixtureId}. Change its title to "${marker} renamed". I confirm this change; go ahead now. ${NOT_HERE}`,
    async check(s, { fixtureId, api }) {
      const f: string[] = [];
      if (calls(s, "update_campaign_settings").length === 0) f.push("update_campaign_settings was never attempted, so the hook was not exercised");
      if (!s.hooks.some((h) => h.event === "PreToolUse" && h.name.includes("update_campaign_settings"))) f.push("the PreToolUse confirmation hook did not run");
      if (!s.denials.includes(tool("update_campaign_settings"))) f.push("the settings change was not held for the organizer's approval");
      const title = (await api.getCampaign(fixtureId))!.title;
      if (title !== FIXTURE_TITLE) f.push(`title changed on dev to "${title}"`);
      return f;
    },
  },
  {
    name: "not-signed-in",
    connector: "none",
    maxTurns: 6,
    maxBudgetUsd: 0.75,
    prompt: () => `How is my PayIt2 campaign doing this week? It's the Spring Legal Defense Fund.`,
    async check(s) {
      const f: string[] = [];
      const server = s.init?.mcpServers.find((m) => m.name === "plugin:payit2-campaign-assistant:payit2");
      if (!server) f.push("the bundled connector did not load");
      else if (server.status === "connected") f.push("the bundled connector is unexpectedly signed in");
      if (s.toolUses.some((u) => u.name.includes("payit2"))) f.push("Claude called a PayIt2 tool while not signed in");
      const paragraphs = s.resultText.split(/\n\s*\n/).filter((p) => /\bsign(?:ing)?[ -]in\b/i.test(p));
      if (paragraphs.length !== 1) f.push(`expected the sign-in mention in exactly one paragraph, found ${paragraphs.length}`);
      if (!s.resultText.includes("?")) f.push("reply does not ask the organizer for their numbers");
      return f;
    },
  },
  {
    name: "create-campaign",
    connector: "dev",
    maxTurns: 30,
    maxBudgetUsd: 3,
    prompt: ({ marker }) =>
      `/payit2-campaign-assistant:campaign Create a new fundraiser on my PayIt2 account as a draft. ` +
      `Title: "${marker} Defense Fund for Maria Lopez". Cause: legal defense for Maria Lopez, a Grand Rapids teacher ` +
      `fighting a wrongful termination case. Goal: $15,000. Theme: the legal-defense preset. No cover image. ` +
      `Use the story you write as the description. I have answered everything; go ahead and create it as a draft. ${NOT_HERE}`,
    async check(s, { marker, api }) {
      const f: string[] = [];
      const creates = calls(s, "create_campaign");
      if (creates.length === 0) return ["create_campaign was not called"];
      if (creates.some((c) => c.input.publish === true)) f.push("create_campaign published instead of creating a draft");
      const mine = (await api.listMyCampaigns(marker)).filter((c) => c.title.startsWith(marker));
      if (mine.length !== 1) return [...f, `expected one new campaign with the marker on dev, found ${mine.length}`];
      const d = (await api.getCampaign(mine[0].id))!;
      if (d.status !== "draft") f.push(`status is ${d.status}, not draft`);
      if (d.role !== "owner") f.push("the fixture organizer does not own the new campaign");
      if (toNumber(d.goalAmount) !== 15000) f.push(`goal is ${d.goalAmount}, not 15000`);
      if ((d.description ?? "").length < 400) f.push(`description is ${(d.description ?? "").length} characters, under 400`);
      if (!/Maria/.test(d.description ?? "")) f.push("description does not name the cause from the brief");
      const themeCalls = calls(s, "update_campaign_settings");
      if (themeCalls.length > 0 && !s.denials.includes(tool("update_campaign_settings"))) {
        f.push("a settings change went through without the organizer's approval");
      }
      return f;
    },
  },
];
```

- [ ] **Step 2: Write `tests/live/run.ts`**

```ts
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, readKeychain, CLAUDE_TOKEN_SERVICE } from "../lib/env.js";
import { connectMcp } from "../lib/mcp.js";
import { DevApi } from "../lib/api.js";
import { ensureFixtureCampaign, runMarker, sweepLeftovers, FIXTURE_TITLE } from "../lib/fixture.js";
import { parseStream, type StreamSummary } from "./stream.js";
import { runClaude } from "./claude.js";
import { SCENARIOS, type Scenario } from "./scenarios.js";

const PLUGIN = fileURLToPath(new URL("../../plugin", import.meta.url));
const MODEL = process.env.E2E_MODEL || "sonnet";

function claudeAuth() {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || readKeychain(CLAUDE_TOKEN_SERVICE);
  if (token) return { CLAUDE_CODE_OAUTH_TOKEN: token };
  if (process.env.ANTHROPIC_API_KEY) return { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY };
  throw new Error("No Claude credential: run `claude setup-token` and store it as the Keychain item payit2-e2e-claude-token (see tests/README.md).");
}

function initFailures(sc: Scenario, s: StreamSummary): string[] {
  if (!s.init) return ["no init event (Claude did not start)"];
  const f: string[] = [];
  if (JSON.stringify(s.init.plugins) !== JSON.stringify(["payit2-campaign-assistant"])) f.push(`unexpected plugins loaded: ${s.init.plugins.join(", ")}`);
  const names = s.init.mcpServers.map((m) => m.name);
  const expected = sc.connector === "dev" ? ["payit2"] : ["plugin:payit2-campaign-assistant:payit2"];
  if (JSON.stringify(names) !== JSON.stringify(expected)) f.push(`unexpected MCP servers: ${names.join(", ")}`);
  return f;
}

const cfg = loadConfig();
const auth = claudeAuth();
const api = new DevApi(cfg);
const mcp = await connectMcp(cfg);
const marker = runMarker();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = fileURLToPath(new URL(`./.runs/${stamp}`, import.meta.url));
mkdirSync(outDir, { recursive: true });

const wanted = process.argv.slice(2);
const selected = wanted.length ? SCENARIOS.filter((s) => wanted.includes(s.name)) : SCENARIOS;
if (wanted.length && selected.length !== wanted.length) throw new Error(`Unknown scenario in: ${wanted.join(", ")}`);

const results: { name: string; passed: boolean; failures: string[]; costUsd: number; version: string }[] = [];
try {
  await sweepLeftovers(api);
  const fixtureId = await ensureFixtureCampaign(mcp, api);
  const devConfig = { mcpServers: { payit2: { type: "http", url: cfg.mcpUrl, headers: { "x-api-key": cfg.apiKey } } } };
  for (const sc of selected) {
    const ctx = { fixtureId, marker, api };
    const run = await runClaude({
      name: sc.name, prompt: sc.prompt(ctx), pluginDir: PLUGIN, outDir,
      mcpConfig: sc.connector === "dev" ? devConfig : undefined,
      maxTurns: sc.maxTurns, maxBudgetUsd: sc.maxBudgetUsd, model: MODEL, auth,
    });
    const s = parseStream(run.jsonl);
    const failures = [...initFailures(sc, s), ...(s.isError ? [`Claude ended with an error: ${s.resultText}`] : []), ...(await sc.check(s, ctx))];
    results.push({ name: sc.name, passed: failures.length === 0, failures, costUsd: s.costUsd, version: s.init?.version ?? "" });
    console.log(`${failures.length === 0 ? "PASS" : "FAIL"}  ${sc.name}  ($${s.costUsd.toFixed(2)})`);
    for (const line of failures) console.log(`      - ${line}`);
  }
} finally {
  // If scenario 3 ever renames the fixture, restore it first: its new title starts with the
  // marker, so the sweep would otherwise hard-delete the standing fixture.
  const renamed = (await api.listMyCampaigns(marker)).find((c) => c.title === `${marker} renamed`);
  if (renamed) await mcp.callText("update_campaign_settings", { campaignId: renamed.id, title: FIXTURE_TITLE });
  await sweepLeftovers(api);
  await mcp.close();
  writeFileSync(join(outDir, "summary.json"), JSON.stringify({ marker, model: MODEL, results }, null, 2));
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed. Transcripts: ${outDir}`);
process.exit(failed.length === 0 && results.length === selected.length ? 0 : 1);
```

- [ ] **Step 3: Type check and unit tests**

Run: `cd tests && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 4: Run the cheapest scenario first**

Run: `cd tests && npm run live not-signed-in`
Expected: `PASS  not-signed-in`. If it fails, open the transcript in `tests/live/.runs/<stamp>/not-signed-in.jsonl` and fix the plugin copy or the check, whichever is wrong. A check may only be loosened when the transcript shows correct organizer-facing behavior that the check misread; write the reason in the commit message.

- [ ] **Step 5: Run the rest**

Run: `cd tests && npm run live`
Expected: `5/5 scenarios passed`. Settle the spec's open items from the transcripts:
- `settings-confirmation` proves the regex matcher fires for `mcp__payit2__update_campaign_settings` and that `ask` is denied headless.
- If `create-campaign` fails only because the model asked a question instead of creating, tighten its prompt, not the check.
Total cost is printed per scenario; expect a few dollars for the full run.

- [ ] **Step 6: Commit**

```bash
git add tests/live/scenarios.ts tests/live/run.ts
git commit -m "test: layer 2 live run of the plugin against dev in five scenarios"
```

Copy `summary.json` from the passing run into the PR description in Task 10 (it holds no secrets).

---

### Task 9: `release.sh` tags main and opens marketplace PRs (D8)

**Files:**
- Modify: `release.sh` (full rewrite), `CLAUDE.md` (Git Workflow section)

- [ ] **Step 1: Replace `release.sh`**

```bash
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
```

- [ ] **Step 2: Check syntax and the main-branch guard**

Run: `bash -n release.sh && DRY_RUN=1 ./release.sh v1.7.0 "v1.7.0 - check"; echo "exit $?"`
Expected: `bash -n` prints nothing; the dry run stops with `Error: run this from main after the release PR has merged` and `exit 1` (we are on `release/2026-10-27`).

- [ ] **Step 3: Update `CLAUDE.md`**

Replace the three numbered steps under `## Git Workflow` with:

```markdown
1. Edit files inside `plugin/` (skills, agents, hooks, scripts, manifest) on a `release/YYYY-MM-DD` branch.
2. Run `cd tests && npm test`, then `./build-plugin.sh` to rebuild the zip.
3. Commit both the changed source files and the updated zip, and open a PR.
4. To release, land the version bump and a `## [X.Y.Z]` CHANGELOG heading through that PR, then run `./release.sh vX.Y.Z "<title>"` from `main`. It tags `main` and opens draft pin PRs in `payit2-plugins-marketplace` and `payit2-team-plugins`; it never pushes to `main`.
5. After the release, run the prod smoke check: install the released plugin, sign in to PayIt2 through `/mcp` as the prod smoke organizer, run `/payit2-campaign-assistant:check-in` on one of that organizer's campaigns, then ask for a title change and decline the permission prompt. No prod credential ever goes into CI.
```

- [ ] **Step 4: Commit**

```bash
git add release.sh CLAUDE.md
git commit -m "chore(release): tag main and open marketplace pin PRs instead of pushing to main

release.sh committed and pushed to main in both repos (PLATFORM-STANDARDS
§15). It now refuses to run until the release has merged, tags main, and
opens draft pin PRs in the public and team marketplaces (spec D8)."
```

---

### Task 10: Version, docs index and draft PR 1

**Files:**
- Modify: `CHANGELOG.md`, `DOCS.md` (generated), `payit2-campaign-assistant.zip`

- [ ] **Step 1: Cut the 1.7.0 heading**

In `CHANGELOG.md`, rename `## [Unreleased]` to `## [1.7.0] - <today's date, YYYY-MM-DD>` and add a fresh empty `## [Unreleased]` above it. `plugin.json` already says `1.7.0` (Task 2).

- [ ] **Step 2: Full local verification**

Run:
```bash
cd tests && npm run typecheck && npm test && npm run connector && cd ..
claude plugin validate plugin --strict
./build-plugin.sh
python3 scripts/docs_index.py generate . && python3 scripts/docs_index.py check --strict .
grep -n -e '—' -e '–' tests/README.md plugin/scripts/session-start.sh plugin/scripts/confirm-settings-change.sh || echo "no dashes"
```
Expected: everything passes; `documentation checks OK`; `no dashes`.

- [ ] **Step 3: Commit and push**

```bash
git add CHANGELOG.md DOCS.md payit2-campaign-assistant.zip
git commit -m "release: 1.7.0 changelog heading and zip"
git branch --show-current   # must print release/2026-10-27
git push -u origin release/2026-10-27
```

- [ ] **Step 4: Open the draft PR**

```bash
gh pr create --draft --base main --head release/2026-10-27 \
  --title "Campaign Assistant 1.7.0: production connector, working hooks, e2e tests" \
  --body-file /tmp/pr1-body.md
```

Write `/tmp/pr1-body.md` first with: a summary of D1 to D9 linking the spec; the hook findings; the live run's `summary.json` (results and cost per scenario, marker, model, CLI version); which isolation mode the live run used (Task 7 Step 5); the follow-ups (app-v2 save tools, live run in CI after the identity rule, payit2.com copy); and the closing line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: Review and wait for CI**

Post a written review on the PR (CHG-3): what could be wrong and how each was checked, at minimum the hook matcher, the dev-only guard, cleanup of test campaigns, and every copy change against D9. Then confirm the `Connector check` run on the PR is green: `gh pr checks <number> --watch` after the checks appear (they can take a few seconds to register). Do not merge. Thomas gives the merge signal (CHG-2).
