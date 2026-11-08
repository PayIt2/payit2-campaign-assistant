---
title: "Publishing the Campaign Assistant to Claude and ChatGPT, with an install funnel: design"
type: spec
doc_status: active
owner: claude-maintained
---
# Publishing the Campaign Assistant to Claude and ChatGPT, with an install funnel: design

**Date:** 2026-11-08. **Author:** Brian, with Claude. **Status:** approved in conversation, awaiting written review.

## Goal

Organizers can install the PayIt2 Campaign Assistant in the chat they already use, Claude or ChatGPT, from a public directory listing in each. Every PayIt2 surface an organizer touches points them to one install page that sends them to the right listing.

## Decisions

| # | Decision | Why |
|---|---|---|
| D1 | Public listings are submitted from PayIt2's own organizations (a claude.ai Team org and an OpenAI org with a verified publisher), not from a personal account. | Claude's directory gives a plugin folder's listing to the first organization that submits it and refuses a second organization's submission of the same folder; the docs describe no transfer. |
| D2 | Until those organizations exist, Brian's personal accounts are used for testing only: uploaded zips, custom connectors, ChatGPT developer mode, and the Claude portal's **Validate** button. Nothing is submitted for review from a personal account. | Keeps D1 possible. |
| D3 | One plugin source, two packages. The Claude package keeps its hooks; the ChatGPT package is built from the same source without them. The skills carry the baseline behavior on their own, and the hooks add to it where they run. | ChatGPT's public directory refuses plugins with lifecycle hooks, and Claude ignores hooks in Chat (claude.ai on the web, desktop chat, mobile); they load only in Cowork and Claude Code ([platform support](https://claude.com/docs/plugins/platform-support.md)). Brian (2026-11-08): keep hook features where Claude supports them. |
| D4 | The "confirm before changing campaign settings" guard also lives in the PayIt2 MCP server. | Claude Chat, ChatGPT and the bare connector run no hooks, so the server is the only guard that holds everywhere. |
| D6 | The plugin's id is `payit2` and its display name is **PayIt2**, in both packages, starting with 2.0.0. The repo keeps its name. | Organizers search for the brand, the paired connector is PayIt2 too, and a Claude listing is tied to its name, so the rename happens before any listing exists. Brian (2026-11-08). |
| D5 | All four funnel surfaces ship in the first version: payit2.com, the app, emails and the public campaign page. All of them link to one page, `payit2.com/ai`. | One destination to maintain; the `from` parameter shows which doorway works. |

## Facts this design rests on (checked 2026-11-08)

**Claude directory** ([publish](https://claude.com/docs/directory/publish), [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist.md)):
- Two listing types: a plugin bundle (from a GitHub repo that is public before the listing goes live) and an MCP connector (a server URL). For our own product we submit both from the same organization and pair them, with the plugin's MCP configuration pointing at the same URL as the connector.
- Submitted and maintained at `claude.ai/directory/manage`. Pro, Max, Ultra, Team or Enterprise; on Team, an Owner submits.
- After the first submission, the directory follows a branch or tag, scans each new commit and serves published versions to everyone who installed the plugin. This is the automatic sync from GitHub.
- Blocking checks that apply to us: a README of at least 40 words in the plugin folder, a `LICENSE` file there or a `license` field in `plugin.json`, and no `.DS_Store` files in the plugin folder.
- Warnings that apply to us: no icon, no privacy policy URL.
- Held for a reviewer: hook scripts the validator cannot follow. Plain shell scripts that name each path from `${CLAUDE_PLUGIN_ROOT}` and call no other files avoid the hold.
- Hooks and agents load in Cowork and Claude Code and are ignored in Chat. Skills and the remote MCP server work everywhere.

**ChatGPT and Codex** ([package your plugin](https://developers.openai.com/plugins/build/plugins), [submission summary](https://sunpeak.ai/blogs/submit-chatgpt-app-as-plugin/)):
- One public plugin directory serves ChatGPT and Codex. Submission is at `platform.openai.com/plugins` by an org owner or a member with Apps Management Write.
- Portable layout: root `plugin.json` (with OpenAI settings under `extensions.com.openai`, including an `onboardingSkill`), root `mcp.json` (servers of type `streamable-http` with a `url`, auth under `extensions["com.openai"].auth`, OAuth with `dcr` supported), `skills/<name>/SKILL.md`, optional `assets/`.
- Plugins with lifecycle hooks are not eligible for the public directory. Agents and commands are not part of the format.
- Required for submission: a remote HTTPS MCP endpoint, website, support, privacy policy and terms URLs, an icon, a verified publisher identity, domain verification at `/.well-known/openai-apps-challenge` if asked, a test account, five positive and three negative test cases, a video walkthrough and release notes.
- A change to skills or listing details needs a new zip and another review. Server-side tool changes are rescanned without a new zip. There is no GitHub sync on this side.

**Not confirmed:** an official "Add to Claude" or "Add to ChatGPT" link or badge format. The install page links to each listing's own URL once it exists.

## Design

### Part 1: Plugin 2.0.0, renamed and directory-ready

The major version marks the rename (D6): commands move from `/payit2-campaign-assistant:<skill>` to `/payit2:<skill>`, and existing installs reinstall under the new id. Behavior is otherwise unchanged.

Changes in `plugin/` and around it:
- Set `name: payit2` and `displayName: PayIt2` in `plugin.json`. Update every reference to the old id: the public and team marketplace entries (through `release.sh` and the pin PRs), `tests/`, `release.sh`, `build-plugin.sh`, the README install lines and the website's install copy.
- Quote `${CLAUDE_PLUGIN_ROOT}` in the three hook commands in `hooks/hooks.json`, so `claude plugin validate --strict` passes.
- Rewrite `scripts/detect-campaign-url.sh` without `jq`, which many machines lack, using plain shell only.
- Add `plugin/README.md`: what the assistant does, what it sends where (PayIt2's MCP server at `mcp.payit2.com`, Unsplash photo search when it picks a cover), how to connect, at least 40 words outside code blocks.
- Add `plugin/LICENSE` (the repo's existing license) and set `license` in `plugin.json`.
- Add a square PayIt2 icon (PNG, 512 to 2048 px, under 2 MB) at `plugin/.claude-plugin/icon.png`, from the brand plugin's assets.
- Set `privacyPolicyUrl` and `homepage` in `plugin.json` to payit2.com pages. Confirm the privacy policy covers data sent through the assistant.
- Remove `plugin/skills/.DS_Store` and add `.DS_Store` to `.gitignore`.
- Raise `version` to 2.0.0 and add a CHANGELOG entry that tells existing installs to reinstall.

Release with `release.sh v2.0.0`. That moves the pin in the public marketplace and in `PayIt2/payit2-team-plugins`, whose draft PR #1 turns green on the new pin.

Success: `claude plugin validate plugin --strict` passes, `scripts/check-sources.sh` in the team marketplace passes, and the Claude portal's **Validate** on Brian's personal account reports no blocking findings (D2: validate only, no submission).

### Part 2: PayIt2 MCP server changes (payit2-app-v2, `mcp-server/`)

Lands through the normal app-v2 flow: work PR into the day's carrier, Thomas's merge, master to prod promotion.

1. **Two-step settings change.** `update_campaign_settings` gains an optional `confirm` boolean.
   - Without `confirm: true`, it saves nothing and returns a preview: each field being changed with its current and new value, and a line telling the assistant to show the preview to the organizer and call again with `confirm: true` only after a clear yes.
   - With `confirm: true`, it saves as today.
   - Exception: a call whose only change is `themeId` saves directly, because `/campaign` applies the theme the organizer already approved in its creation summary.
   - The tool description states this contract so any client's model follows it.
2. **Tool annotations.** Every tool declares MCP annotations: `readOnlyHint: true` on reads (list, get, overview, health, insights, forecasts, templates, themes), `readOnlyHint: false` on writes, and `destructiveHint: true` on `delete_campaign_question`. Clients that honor them ask before writes.
3. **ChatGPT sign-in.** Add ChatGPT's OAuth callback host to `OAUTH_ALLOWED_REDIRECT_HOSTS` and confirm the WAF in front of `mcp.payit2.com` allows it. Verify on dev with a ChatGPT developer-mode connection before prod.
4. **Domain verification.** Serve the token OpenAI issues as plain text at `/.well-known/openai-apps-challenge` on the MCP host, from configuration, not code.

Tests: unit tests for the preview, the confirm path and the theme-only exception; annotation presence for every registered tool; the changed-line coverage gate.

Depends on B-380 (Claude desktop sign-in, in PR #1915) reaching prod for the Claude desktop path.

### Part 3: Plugin 2.1.0, skills that stand alone, plus the ChatGPT package

Ships after Part 2 is on prod. The hooks stay in the Claude package (D3); this part makes sure an organizer gets the same core experience where hooks do not run (Claude Chat and ChatGPT), and lets the hooks add to it in Cowork and Claude Code.

| Behavior | Baseline in the skills (everywhere) | Claude hook (Cowork and Claude Code) |
|---|---|---|
| Greeting | `campaign-context` opens a session: if PayIt2 tools are available, call `list_my_campaigns` once and name any urgent campaign; if not, say nothing about sign-in until the organizer asks about live numbers. In the ChatGPT package it is the `onboardingSkill`. | SessionStart keeps giving the greeting at the start of every session, before the organizer asks anything. |
| Campaign-link detection | Skill descriptions name payit2.com campaign links as a trigger, and `campaign-context` says what to do with one: fetch the overview if tools are available, otherwise ask for the numbers. | UserPromptSubmit keeps adding the link's type and slug to the turn. |
| Settings confirmation | Part 2's server preview, and the skills' rule to show current and new values and wait for a clear yes. | PreToolUse shows Claude's native approve prompt on the saving call (`confirm: true`) only. The preview call and theme-only calls pass without a prompt, so the organizer is not asked twice for the same step. |

- **Connection wording per platform.** The steps for connecting PayIt2 (today "Customize > Plugins ... Connectors tab" in `campaign` and `campaign-context`) move into one file per platform, `plugin/skills/campaign-context/references/connect-claude.md` and `connect-chatgpt.md`. The skills point to "the connection steps for this chat". The Claude package ships the Claude file; `build-openai.sh` ships the ChatGPT file in its place.
- **The agent** stays in the Claude package and is left out of the ChatGPT package, which has no agents.
- **`build-openai.sh`** creates `dist/payit2-openai.zip` from `plugin/`:
  - `plugin.json`: name, version and description from `plugin/.claude-plugin/plugin.json`, the agent-plugins schema, and `extensions.com.openai` with display name, icon, website, support, privacy and terms URLs and `onboardingSkill: campaign-context`.
  - `mcp.json`: one server, `payit2`, type `streamable-http`, url `https://mcp.payit2.com/mcp`, auth `oauth` with `dcr`.
  - `skills/`: copied unchanged. `assets/`: the icon.
  - It leaves out `hooks/`, `scripts/`, `agents/` and the Claude connection file, and fails if the result still holds anything the OpenAI format does not take.
- **`release.sh`** builds both zips and attaches the ChatGPT zip to the marketplace release.
- CI runs `build-openai.sh` and checks the zip's layout.

Success: the Claude plugin passes **Validate** with no blocking findings; the ChatGPT zip installs in ChatGPT developer mode on Brian's personal account; in Claude Chat, Cowork and ChatGPT, a settings change shows a preview and saves only after a yes, and the organizer is asked once per change, not twice.

### Part 4: Testing on personal accounts, then the public listings

**Testing now (D2):**
- Claude: upload the plugin zip in Customize > Plugins and add `https://mcp.payit2.com/mcp` as a custom connector.
- ChatGPT: install the ChatGPT zip with developer mode on.
- Run the same script in each: sign in, `/campaign` for a test event as a draft, check-in on a campaign, a declined settings change.

**Public listings (after D1's organizations exist):**
- Claude, from PayIt2's Team org: submit `mcp.payit2.com/mcp` as an MCP connector; submit the plugin bundle from `PayIt2/payit2-campaign-assistant`, folder `plugin`, following release tags; pair the two.
- ChatGPT, from PayIt2's OpenAI org: submit the ChatGPT zip with the test account, the five positive and three negative test cases, the walkthrough video and the release notes; publish after approval.
- These steps are done by an owner in each portal. Claude prepares every text field, the test cases and the video script.

### Part 5: The install funnel

**The page: `payit2.com/ai`** (payit2-website), "Use PayIt2 in Claude or ChatGPT".
- Two buttons, Claude and ChatGPT, with one line each on what the assistant does there: build a campaign page in a few minutes, check how it is doing, write the posts and emails.
- Before the listings are public, each button opens step-by-step install instructions for that chat. After, each links to its listing. The switch is a small config change, not a redesign.
- Every link into the page carries `?from=<place>`. The page passes it on to the listing links where the listing allows it.

**Doorways:**
- **payit2.com:** a section on the home page and an entry in the main navigation, `from=site-home` and `from=site-nav`.
- **App (payit2-app-v2):** a dismissible card on the organizer dashboard (`from=app-dashboard`) and a card on the campaign-created screen (`from=app-created`). An organizer who dismisses the dashboard card does not see it again.
- **Emails (payit2-app-v2):** one line in the welcome email (`from=email-welcome`) and the campaign-launched email (`from=email-launched`).
- **Public campaign page (payit2-app-v2):** a small footer link for would-be organizers, "Start your own campaign with Claude or ChatGPT" (`from=campaign-page`). Supporters are not interrupted.

Copy follows PayIt2's terminology: Organizer, never User; no em dashes.

**Measurement:** visits and button clicks on `payit2.com/ai` by `from` value, in the site's existing analytics.

## Order of work

1. Part 1 (plugin 2.0.0). No dependencies.
2. Part 2 (server) and the `payit2.com/ai` page in its instructions mode, in parallel.
3. Part 3 (plugin 2.1.0) after Part 2 reaches prod.
4. Part 4 testing on personal accounts, then the public submissions once PayIt2's organizations exist.
5. Part 5 doorways in the app and emails, then the page switches to listing links when the listings go live.

## Out of scope

- A Codex-specific build beyond the shared ChatGPT and Codex directory package.
- Paid placement or partner programs in either directory.
- New assistant features. This design moves existing behavior; it does not add skills.

## Open questions

- Q1: Which claude.ai plan and OpenAI organization will PayIt2 use, and who is the owner in each? Blocks Part 4's public submissions only.
- Q2: Does payit2.com's privacy policy cover data the assistant sends to PayIt2 and to Unsplash, or does it need a section?
- Q3: Which OAuth callback host does ChatGPT use for plugin connections today? Confirm during Part 2 testing on dev.
