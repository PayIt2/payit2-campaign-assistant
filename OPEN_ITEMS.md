---
title: "Open Items — payit2-campaign-coach"
type: worklist
doc_status: active
owner: claude-maintained
---
# Open Items — payit2-campaign-coach

> **Platform roadmap:** See `../../payit2-business/PLATFORM-STANDARDS.md` Section 19 for the org-wide implementation phases.
>
> **Structure (2026-06-05 audit, classifier-mode rebuild):** Single prioritized list. Items 1–N are **must-do before V2 dev-complete** (the stage where board members begin testing V2 platform). Items N+1 onward are **backlog** (any time after V2 dev-complete; can be picked from at will). History (date, prior rationale, source PR) is preserved inline per item. `⚠️ NEEDS THOMAS` tags items where I couldn't classify alone — resolve at the top.
>
> Items resolved during the audit (i.e. verified as actually done) move to [`COMPLETED_ITEMS.md`](COMPLETED_ITEMS.md). Items determined to no longer apply get a one-line deletion note in the audit log at the bottom, not their own section.
>
> **Last audit:** 2026-06-05. Audit method: every item verified against current repo state AND the live payit2.com website (not just README claims).

---

## Verification notes from this audit

- **Plugin live status:** ✅ Live in PayIt2's OWN marketplace. payit2.com/ai-assistant.html instructs users to run `/plugin marketplace add PayIt2/payit2-plugins-marketplace` then `/plugin install payit2-campaign-assistant`. The plugin zip is published at `github.com/PayIt2/payit2-plugins-marketplace/releases/latest`. NOT listed in Claude's central public Discover tab — that's a separate (and larger) submission milestone, tracked as B-2 below.
- **Canonical product name:** the plugin is **PayIt2** (id `payit2`, since 2.0.0); the website calls the product the AI Campaign Assistant. Repo `PayIt2/payit2-ai-plugin` (renamed 2026-11-08); zips `payit2-claude-plugin.zip` and `payit2-chatgpt-plugin.zip`.
- **Repo naming drift:** GitHub repo and filesystem are `payit2-campaign-coach`. Everything user-facing is `payit2-campaign-assistant`. Real outstanding work to reconcile — surfaced as B-3.

---

## ⚠️ Open questions for Thomas (resolve these first)

_(None outstanding. Q1 — REST API timing — was resolved by cancelling B-1; see audit log.)_

---

## How items are organized — by "why we need to do this"

> Added 2026-06-08 per CEO direction. Items grouped by motivation. Original B-numbered IDs preserve so cross-references still resolve; the sections below this index keep their chronological order.
>
> **Priority order**: Engineering Health first — plugin is live and installable today via PayIt2's own marketplace. Launch Gates empty — plugin is already shipped. Growth — distribution + discovery work.

### Engineering Health — plugin is live; hygiene stays continuous

B-4 Put the `/mcp` sign-in step back once prod accepts Claude Code's sign-in
B-5 Move the live e2e run into CI
B-6 Make the connector check a required status check
B-7 Server-side fixes found in the 2026-11-10 test run (app-v2)

### Launch Gates

_(none — plugin is already published in PayIt2's own marketplace and installable today)_

### Growth — distribution + discovery; post-launch, compounds

**Marketing & Content** — visibility, discovery
B-1 Submit to Claude's central public Discover tab

---

## Must-do before V2 dev-complete

_(None. All open work in this repo is post-V2-dev-complete cosmetic / discovery work.)_

---

## Backlog (any time after V2 dev-complete)

### B-1. Submit to Claude's central public Discover tab
**Source:** original OPEN_ITEMS item, was titled "Publish to Claude plugin directory" — reframed for precision.
**Verified 2026-06-05:** ✅ Real. The plugin IS installable today via PayIt2's own marketplace (`/plugin marketplace add PayIt2/payit2-plugins-marketplace` + `/plugin install payit2-campaign-assistant`) but is NOT in Anthropic's central Discover tab. Submission to Anthropic is a separate process that hasn't been initiated.
**Classification rationale:** Marketing/discovery enhancement. Allows users to find PayIt2 Campaign Assistant without first knowing about PayIt2's marketplace. Backlog — not on the V2 dev-complete path.

_(B-2 closed 2026-06-09 — see COMPLETED_ITEMS.md)_

### B-4. Put the `/mcp` sign-in step back once prod accepts Claude Code's sign-in
**Source:** 1.7.0 (spec D12, 2026-11-04).
**Why:** prod's edge answers any sign-in registration carrying a `http://localhost` redirect with an HTML 403, and prod's `OAUTH_ALLOWED_REDIRECT_HOSTS` lacks loopback hosts, so Claude Code cannot sign in to PayIt2. The Claude desktop app and claude.ai can. 1.7.0's skills and README say Claude Code sign-in is coming instead of sending anyone to `/mcp`.
**Depends on:** the app-v2 and edge fix (Thomas). **Done when:** the skills and README name `/mcp` again, and live scenario 4 (not signed in) passes.

### B-5. Move the live e2e run into CI
**Source:** 1.7.0 (spec D3).
**Why:** `npm run live` runs headless Claude against dev on Brian's machine with his Claude token. CI needs a workload identity rule, which only Thomas can add (§4).

### B-6. Make the connector check a required status check
**Source:** 1.7.0 final review.
**Why:** `connector.yml` runs on every plugin or tests PR, but nothing stops a merge when it is red. Branch protection is a console setting only Thomas can change.

### B-7. Server-side fixes found in a 2026-11-10 test run (app-v2, Thomas)
**Source:** Brian's end-to-end test of creating a fundraiser from Claude chat, 2026-11-10.
**Why:** these live in the PayIt2 MCP server, not this repo, so the plugin cannot fix them:
1. `create_campaign`'s description says `options` are for registration and group payment campaigns only, but fundraisers accept them and the `campaign` skill uses them for giving levels. Name fundraiser giving levels in the tool text.
2. Fundraiser templates (Community Project, for one) carry no suggested amounts, so a campaign made without the skill gets no giving levels. Give each fundraiser template default amounts, or say in `list_templates` which ones have none.
3. `get_campaign_health` reports "Healthy, on track" for a draft at $0 with no gifts and no end date. It should say not started or needs a first gift.
4. No tool deletes a campaign, so test drafts made from chat cannot be cleaned up there. Add `delete_campaign`, limited to drafts with no payments.
5. The connector's server instructions could say "load the PayIt2 `campaign` skill before calling `create_campaign`", for clients that list plugin skills without their descriptions.
**Done when:** each is shipped or declined, and the skills drop any workaround for it.

---

## Audit log (2026-06-05)

- **Method:** Each item verified against (a) current repo state — grepped for the referenced files, counted matches — AND (b) live payit2.com website install instructions. Two-source confirmation, not paper exercise.
- **One item cancelled as no-longer-applicable:** original "Connect to live PayIt2 REST API (direct, separate from MCP)" — cancelled 2026-06-05 with Thomas. Rationale: the MCP server (`mcp.payit2.com`) is the designed path between Claude plugins and the backend REST API. A second direct-REST integration in the plugin would duplicate functionality the MCP server already provides and bypass the auth + transcoding layer it wraps. Was probably a leftover from a pre-MCP design.
- **One item added then immediately removed:** I initially flagged a "repo rename from `payit2-campaign-coach` → `payit2-campaign-assistant`" task. Then `gh repo view PayIt2/payit2-campaign-coach` returned `name: payit2-campaign-assistant` — the GitHub-side rename has already happened. The local clone directory still uses the old name (cosmetic only, doesn't affect anything in production). Cancelled the audit-added item.
- **One item reframed for precision:** original "Publish to Claude plugin directory" → B-1 "Submit to Claude's central public Discover tab." The plugin IS published in PayIt2's own marketplace; the open work is Anthropic's central catalog.
- **Discrepancy resolved:** Thomas said the plugin was "already live." Verification: ✅ live in PayIt2's own marketplace; ❌ NOT in Claude's central Discover tab. The original "Publish to Claude plugin directory" item refers to the latter and remains open as B-2.
