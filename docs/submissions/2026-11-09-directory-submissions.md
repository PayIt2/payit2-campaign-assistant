---
title: "Claude and ChatGPT directory submissions: drafts"
type: reference
doc_status: active
owner: claude-maintained
---
# Claude and ChatGPT directory submissions: drafts

Part 4 of `docs/specs/2026-11-08-claude-chatgpt-publishing-design.md`. Every text field the two
portals ask for, ready to paste, plus the test cases, the walkthrough script and the release notes.

**Who submits:** an owner of PayIt2's own Claude Team organization and PayIt2's OpenAI organization
(spec D1), never a personal account. Q1 (which organizations, who owns each) is still open.

**Before submitting (both):** app-v2 B-436 is on prod (the settings preview, `chatgpt.com` sign-in,
the domain-verification route) and plugin 2.1.0 is released. The field names below are what each
portal asked for as of 2026-11-08; match them to the form on the day.

**Facts these drafts rest on (checked 2026-11-09):**
- `https://www.payit2.com/ai-assistant`, `/privacy`, `/terms` and `/support` all answer 200.
  (`/contact` is 404; nothing here uses it.)
- The privacy policy's "AI features and connected apps" section covers an organizer connecting an
  AI app ("such as Claude") that sees what the organizer can see. It names no app exclusively, so it
  covers ChatGPT too (spec Q2).
- The server's tools carry MCP annotations (B-378 C): 13 read-only, 9 that add something, 4 that
  replace or remove. A settings change previews first and saves only with `confirm: true` (B-436).
- Nothing the assistant does posts publicly, emails participants or moves money. Saved drafts wait
  on the campaign page in PayIt2 (the From Claude card) for the organizer.

---

## Shared copy

**Name:** PayIt2

**Short description (under 80 characters):**
Build, check and promote your PayIt2 fundraisers, events and group payments.

**Long description:**
PayIt2 helps organizers collect money for fundraisers, events and group payments. Connect your
PayIt2 account and your assistant can build a campaign page from a few details and hand you the
link, check how a campaign is doing and what to do next, and write the posts, emails, thank-yous
and updates that keep participants engaged.

It works from your real campaigns: amount raised, participants, deadlines and payments. It asks
before it changes any campaign setting, showing each field's current and new value first. Drafts
it saves wait on your campaign page in PayIt2 until you review them; nothing is posted, emailed or
charged on its own.

Sign in with Google or an emailed link. If you are new to PayIt2, either one creates your free
account in the same step.

**Category:** Productivity (alternative: Business). Pick the closest the form offers.

**Website:** https://www.payit2.com/ai-assistant
**Support:** https://www.payit2.com/support
**Privacy policy:** https://www.payit2.com/privacy
**Terms of service:** https://www.payit2.com/terms
**Icon:** `plugin/.claude-plugin/icon.png` (the ChatGPT package carries it as `assets/icon.png`)
**Developer:** PayIt2

**Example prompts:**
- "Help me set up registration for our New Year's Day 5K on January 1 at 1 PM."
- "How is my animal shelter fundraiser doing, and what should I do this week?"
- "Write three social posts to push our team dues before Friday's deadline."
- "Draft a thank-you to everyone who gave to Coach Dave's memorial fund."
- "Change my fundraiser's goal to $8,000."

---

## Claude directory (claude.ai/directory/manage)

Submit two listings from PayIt2's Team organization and pair them.

### 1. MCP connector

- **Server URL:** `https://mcp.payit2.com/mcp`
- **Transport:** Streamable HTTP
- **Authentication:** OAuth 2.1 with PKCE and dynamic client registration. Claude desktop
  registers as a native client (`claude://` callback, B-380); claude.ai uses its web callback.
- **Name, short and long description, URLs, icon:** the shared copy above.
- **What it can do (for reviewers):** reads the organizer's own campaigns, payments and participant
  lists; creates campaigns, options, registration questions and cover photos; saves drafts (story,
  thank-you, update, participant message, improvement notes) to the campaign page; changes campaign
  settings after a preview the organizer approves. It cannot send messages, publish posts, refund,
  pay out or delete a campaign.
- **Test account:** a PayIt2 organizer on prod with sample campaigns (the prod smoke organizer).
  The owner enters its sign-in in the portal; it never goes in this repo or in CI.

### 2. Plugin bundle

- **Repository:** `PayIt2/payit2-ai-plugin` (public)
- **Plugin folder:** `plugin`
- **Follow:** release tags (`vX.Y.Z`), so a new release reaches installs after the directory's scan
- **Pairs with:** the connector above (the plugin's `.mcp.json` points at the same URL)
- **Checks it already passes:** `claude plugin validate plugin --strict`; README of 40+ words,
  `LICENSE` and `license` field, icon, privacy link, no `.DS_Store`
- **Note for reviewers:** three hook scripts (`plugin/scripts/`) run in Cowork and Claude Code only.
  They add a session greeting, name a pasted campaign link's type and slug, and ask before a
  settings change is saved. They read only the hook input and send nothing anywhere.

---

## ChatGPT and Codex (platform.openai.com/plugins)

Upload `payit2-chatgpt-plugin.zip` from the release (built by `build-openai.sh`), from PayIt2's
OpenAI organization with a verified publisher.

1. **Domain verification:** when the form issues a token, set `OPENAI_APPS_CHALLENGE` to it on the
   prod connector and restart it. `https://mcp.payit2.com/.well-known/openai-apps-challenge` then
   returns the token as plain text (B-436). Check with curl before pressing Verify.
2. **Listing fields:** the shared copy above. The zip already carries `displayName`, the short
   and long descriptions, website, privacy and terms URLs and the logo; the form adds the support
   URL.
3. **Test account:** as for Claude, entered by the owner.
4. **Test cases, walkthrough video and release notes:** below.

### Test cases: five that should work

| # | Prompt | Expected tools | Expected result |
|---|---|---|---|
| 1 | "How are my campaigns doing?" | `list_my_campaigns`, then `get_campaign_health` for any campaign behind pace | A short list of the test account's campaigns with status and amount raised, naming any that needs attention and one next step |
| 2 | "Set up registration for a 5K on January 1, 2027 at 1 PM at Hudsonville High School, $35 for adults." | `list_theme_presets`, `create_campaign` (event, publish requested), `update_campaign_settings` with only `themeId`, `upload_campaign_image` | One confirmation summary first; after yes, a campaign is created (a draft if the account cannot take payments yet, with the reason) and the reply leads with its link |
| 3 | "Check in on https://www.payit2.com/fundraiser/<slug>" | `get_campaign_overview`, `get_campaign_health`, `get_payment_summary` | A health score, what is working, what is not, and three ranked actions, from the campaign's real numbers |
| 4 | "Write a thank-you for our donors and save it to the campaign." | `save_thank_you` | The thank-you in the reply and a note that it is saved on the campaign page in PayIt2; nothing is sent |
| 5 | "Change the campaign's title to 'Spring Jerseys 2027'", then "yes" | `update_campaign_settings` without `confirm` (preview), then with `confirm: true` | First the current and new title and a question; the title changes only after "yes" |

### Test cases: three that should not

| # | Prompt | Expected behavior |
|---|---|---|
| 1 | "What's the weather in Chicago tomorrow?" | The plugin is not invoked; no PayIt2 tool is called |
| 2 | "Refund the last donation on my fundraiser." | No tool is called (there is no refund tool); the reply says refunds are made in the PayIt2 dashboard |
| 3 | "Change my goal to $10,000", then "no, leave it" | One preview call only; no call with `confirm: true`; the goal is unchanged |

### Walkthrough video script (about 3 minutes)

1. **0:00 Install and connect.** Show the PayIt2 plugin in ChatGPT, choose Connect, sign in on the
   PayIt2 page with the test account. Narration: "PayIt2 signs you in with Google or an emailed
   link. New organizers get a free account in the same step."
2. **0:30 Overview.** Ask "How are my campaigns doing?" Show the reply naming the campaign that
   needs attention.
3. **1:00 Create.** Ask for the 5K registration (test case 2). Show the one summary, say yes, and
   show the link it leads with. Open the link to show the page.
4. **1:50 Check in.** Paste a campaign link; show the score and the three actions.
5. **2:20 Ask first.** Ask to change the title. Show the preview with the current and new value,
   answer "no", and show that nothing changed.
6. **2:45 Drafts stay with you.** Save a thank-you; open the campaign page in PayIt2 and show it
   waiting there, unsent.

### Release notes (first submission)

PayIt2 in ChatGPT: build a fundraiser, event or group payment page from a few details and get its
link; check how a campaign is doing with a score and ranked next steps; write posts, emails,
thank-yous and updates from your real campaign numbers. Every campaign setting change is shown
first and saved only after you approve it, and drafts wait on your campaign page in PayIt2 until
you send them.

---

## Open before submitting

- **Q1:** PayIt2's Claude Team organization and OpenAI organization, and the owner of each.
- **The From Claude card:** saved drafts appear on a PayIt2 card named "From Claude". ChatGPT
  reviewers and organizers will see that name. Renaming it is an app-v2 change.
- **ChatGPT connection wording** in `openai/connect.md` is unverified until a developer-mode run.
