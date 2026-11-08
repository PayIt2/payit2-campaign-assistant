---
name: campaign
description: Create a PayIt2 campaign fast (fundraiser, event, or group) and hand the organizer a link to their page in minutes, then help them improve it
allowed-tools: Read, Write, WebSearch
argument-hint: "[optional: type of campaign or brief description]"
---

# Campaign Creation and Launch

The goal is a real campaign page and its link, in the organizer's hands within a few minutes. Get the few facts only the organizer knows, decide everything else yourself with good defaults, confirm once, create it, and give them the link. Depth (the full story interview, title options, more tiers, registration questions, a better photo) comes afterwards, while they are already using the page.

**No em dashes in anything you write for the organizer.** Use a comma, colon or period instead; PayIt2's style forbids them.

**Speed rules for this skill:**
- Never ask a question you can answer with a sensible default. Make the call, show it in the summary, and let them change it.
- Ask for the basics in **one** message, not one question at a time. This overrides the one-question rule in `campaign-context` for this skill's fast path.
- Never offer a menu of choices before the campaign exists (no five titles, no three photos, no theme list). Pick the best one.
- Never re-ask anything already in the conversation or the arguments.

---

## Step 1: Connect PayIt2 (only if it is not connected)

Check whether PayIt2 tools such as `create_campaign` and `list_my_campaigns` are available in this session.

**If they are**, go straight to Step 2; there is nothing to set up.

**If they are not**, tell the organizer in a few lines, before anything else, that connecting PayIt2 lets you create the page and hand them its link, and how to do it:

> To build your page for you, I need to be connected to PayIt2. It takes about 30 seconds:
> 1. Open **Customize > Plugins**, choose **PayIt2 Campaign Assistant**, and open its **Connectors** tab.
> 2. Click **Connect** next to PayIt2.
> 3. On the PayIt2 sign-in page, choose **Continue with Google** or **Email me a sign-in link**. If you are new to PayIt2, either one creates your free account in the same step.
>
> Then tell me "connected". Or, if you'd rather not connect right now, I'll write everything so you can paste it into payit2.com.

Rules for this step:
- Steer new organizers to **Continue with Google** or **Email me a sign-in link**, not the sign-up form: both create the account and bring them straight back to Claude.
- In Claude Code, signing in to PayIt2 is not available yet. Say in one sentence that it is coming, then use the standalone finish at the end of this skill.
- This counts as the conversation's one sign-in mention (see `campaign-context`). Do not repeat it.
- If the organizer says "connected" but the PayIt2 tools still are not available, ask them to start a new chat and run /campaign again; everything they told you is above to paste in. Do not loop on this.
- While they connect, you may go ahead with Step 2 so no time is lost.

---

## Step 2: Get the basics in one message

Work out the type from what they already said: a run, dinner, tournament, class or party is an **event**; helping a person, family, school or cause with a money goal and no tickets is a **fundraiser**; splitting a shared cost among known people (dues, a cabin, a gift) is a **group**. Ask only if it is truly unclear.

Then ask, in a single message, for only the facts you cannot guess. Tell them a rough answer is fine.

| Type | Ask for |
|---|---|
| Event | What it is and who it benefits (if anyone), date and start time, venue or address, and the price (or free) |
| Fundraiser | Who it is for and what happened, in a sentence or two, and the goal amount (offer to suggest one) |
| Group | What the money is for, how much per person (or the total and headcount), and the deadline |

If their first message already covers these, skip straight to Step 3.

---

## Step 3: Decide everything else yourself

Fill every remaining field with your best call. Do not ask about these.

| Field | Default |
|---|---|
| Title | One title under 60 characters with the key proper noun (event name, person, school or group) and the year for events. Fundraisers start with "Help" or "Support" when it fits. |
| Description | A short HTML draft written from what they told you: about 100 words for a fundraiser, under 150 for an event, under 75 for a group. Hook, the facts, a clear call to action. Invent no facts: if you do not know it, leave it out. |
| Blurb | One plain-text line for link previews. |
| Event end time | Start plus 2 hours (a 5K or short event: plus 1.5 hours). |
| Event time zone | From the venue's location, as an IANA name (Michigan is America/Detroit). |
| Registration deadline | Leave it out, so registration stays open until the event, unless they named one. |
| Event tickets | The prices they gave, as options in a required "Registration" or "Tickets" group (choose one). If they gave one price, add a $15 or half-price "Student / Kid (18 and under)" tier only for family events such as runs and festivals. Skip early bird pricing in the fast path: PayIt2 options cannot switch price on a date, so it would need manual changes later. |
| Fundraiser goal | What they said. If they asked you to suggest one, use the guide's benchmarks and keep it under $5,000 when the need allows, since smaller goals succeed more often. |
| Group options | One option at the per-person amount; split the total by headcount and round up to the next dollar to cover fees. |
| Theme | Call `list_theme_presets` and pick the preset whose use cases best match the campaign (a run or walk is `charity-walk`, school boosters or PTA is `school`, a team is `sports-team`, a medical need is `medical`, legal defense is `legal-defense`, a memorial is `memorial`, a reunion is `reunion`). Use `classic-green` when nothing fits. |
| Cover photo | If they shared a photo URL, use it. Otherwise find one strong Unsplash photo yourself (see Step 5) and use it. Do not show them options first. |
| Template | Call `list_templates`. Use a template's slug only if it clearly matches this campaign; never ask about it. |

Add no registration questions, add-ons or extra groups in the fast path unless the organizer asked for them. Those go on the "make it better" list.

---

## Step 4: Confirm once

Show one compact summary and ask a single yes or no question. For example:

> Here's your page:
> - **Title:** Hudsonville Boosters New Year's Day 5K 2027
> - **When:** Fri, Jan 1, 2027, 1:00 to 2:30 PM ET
> - **Where:** Hudsonville High School, Hudsonville, MI
> - **Tickets:** Adult $35, Student / Kid $15, Virtual Runner $25
> - **Look:** Charity Walk theme with a race finish line photo
> - **Description:** (two or three line preview)
>
> Create it and put it live? You can change anything afterwards.

The organizer's yes to this summary covers creating the campaign, publishing it, uploading the photo and applying the theme shown. If they want changes, make them and show the summary again. If they say "create it but don't publish yet", create it as a draft.

---

## Step 5: Create it and get the link

Do these in order, without further questions:

1. **Create.** Call `create_campaign` with the title, mode, description (HTML), blurb, the type's fields (goal, event dates with the UTC offset, time zone, venue and options) and `publish: true`, unless the organizer asked for a draft. If PayIt2 cannot publish yet (usually because Stripe is not connected for a paid campaign), it creates a draft and the reply says why; that is fine, carry on. Save the campaign ID and URL.
2. **Theme.** Call `update_campaign_settings` with only the campaign ID and the theme you picked. This is the theme the organizer already approved in Step 4, so do not ask again.
3. **Cover photo.** Call `upload_campaign_image` with `imageUrl`. To find a photo, fetch Unsplash's own search for free landscape photos, `https://unsplash.com/s/photos/<two-or-three-words>?orientation=landscape&license=free` (for a run: running-race), pick the result that best fits the campaign and the season (no summer beach shots for a January race), and use its images.unsplash.com address with `?w=1600&q=80`. Use only images.unsplash.com photos: plus.unsplash.com photos are Unsplash+, a paid license. Landscape matters because the page shows covers as a wide 3:1 strip, and a portrait photo crops to a sliver. If the upload fails, try one other photo, then move on and put "add a cover photo" on the list in Step 6. Never say a photo was uploaded when it was not.

If `create_campaign` itself fails, tell the organizer plainly what PayIt2 said, fix what you can (a date format, a missing field) and try once more. Do not retry a create whose outcome is unknown: call `list_my_campaigns` first to see whether it exists.

---

## Step 6: Hand over the link and the "make it better" list

Lead with the link. Then say in one line whether it is live or a draft, and what makes it live if it is a draft. Then offer a short list of the improvements that matter most for this campaign, ranked, and let them pick. For example:

> Your page is live: **<campaign URL>**
>
> Share it now, or pick something to make it better:
> 1. **Connect Stripe** so you can take payments (Settings > Payments in PayIt2). *(only if it stayed a draft or Stripe is not ready)*
> 2. **Race-day details:** course, packet pickup, parking, awards, food.
> 3. **Add-ons:** race T-shirts by size, an extra donation option.
> 4. **Add a co-organizer** to help share it (campaigns with one reach their goal 3x more often).
> 5. **Promote it:** I'll write the posts and emails.

Pick list items from what is actually missing: fundraisers usually want the fuller story, a video script and a co-organizer; events want logistics, add-ons and registration questions; groups want the member reminder message. "Promote it" hands off to /promote.

When they pick an item, follow `references/enrich-guide.md` for that item. Once the campaign exists, ask one question at a time again, and before changing any campaign setting (title, description, goal, end date, theme or colors), show the organizer each field's current and new value and wait for a clear yes.

If they have a Stripe Connect account that is fully verified with a non-individual business type (LLC, non-profit, government entity), a "Verified" badge appears next to their name on the public page automatically. No extra step is needed.

---

## Standalone finish (PayIt2 not connected)

Run Steps 2 to 4 the same way, then give the organizer one paste-ready block: title, blurb, description, date, time and place (events), goal (fundraisers), ticket or payment options with prices, the theme name and the cover photo link. Tell them to sign in or create a free account at payit2.com, choose to start a campaign and paste these in. Then offer the same "make it better" list.

---

## Content Formatting Rules

PayIt2 fields fall into two categories. Use the wrong format and the page shows raw tags or a broken layout.

**HTML fields:** `description`, and the content of `save_campaign_story`, `save_update_post` and `save_thank_you`. Allowed tags: `<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<br>`, `<a href="">`. No inline styles, no `<div>` wrappers, no `<h1>`.

**Plain-text fields (no HTML, no markdown):** title, blurb, venue name, address, city and state, option titles and descriptions, question text and details, and any other short label.

The campaign `description` is the story the page shows. Do not also save the same story with `save_campaign_story`; use that only for another version the organizer wants to keep.

---

## Additional Resources

- **`references/enrich-guide.md`** - The full story interview, five-title scoring, description structures, pricing and goal guidance, options vs. questions, photo preparation and launch checklists, for after the campaign exists
- **`references/story-templates.md`** - Category-specific story templates for fundraisers, events, and collections
- **`references/title-formulas.md`** - Proven title patterns with scoring rubric for all types
- **`references/ticket-strategy.md`** - Ticket tier templates, pricing formulas, group discount structures
- **`references/cost-splitting-guide.md`** - Fixed split calculator, tiered examples, fee transparency, overages
