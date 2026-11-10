---
title: "Enrich Guide"
type: reference
doc_status: active
owner: claude-maintained
---
# Enrich Guide

Depth for a campaign that already exists. The /campaign skill creates the campaign first with sensible defaults; use this guide when the organizer picks an item from the "make it better" list, or asks for a richer story, better title, more tiers, registration questions or a better photo. Ask one question at a time here: the campaign is already live or in draft, so there is no rush.

**No em dashes in anything you write for the organizer.** Use a comma, colon or period instead.

**Before changing any campaign setting** (title, description, goal, end date, theme or colors), show the organizer each field's current and new value and wait for a clear yes.

## The Story / Details Interview

Ask questions one at a time, building on each answer. Adapt to the campaign type.

### Fundraiser Interview
1. **Who needs help?** Name, relationship, one humanizing detail.
2. **What happened?** The specific situation in their own words.
3. **What do the funds cover?** Specific, tangible line items (medical bills, legal fees, rent).
4. **What's the timeline?** Urgency: court dates, medical deadlines, eviction notices.
5. **What happens without help?** The stakes and consequences.
6. **Who is already helping?** Co-organizers, community support, existing efforts.

### Event Interview
1. **What type of event is it?** Category (conference, party, concert, reunion, etc.) and brief description.
2. **When and where?** Date, start/end time, timezone, venue name and address (or virtual platform).
3. **What's the capacity?** Max attendees. Separate by tier if applicable.
4. **Is there a registration deadline?** Date after which no new registrations are accepted. Many events set this 24-48 hours before the event.
5. **Is it free or paid?** If paid: ticket prices and tiers. If free: confirm attendees just RSVP at no charge.
6. **What will attendees experience?** Agenda, speakers, activities, food/drink, entertainment.
7. **What do attendees need to know?** Dress code, what to bring, accessibility, age restrictions, refund policy.

### Group Interview
1. **What's the collection for?** Specific purpose: team jerseys, cabin rental, birthday gift, club dues, etc.
2. **How many people are in the group?** Exact or estimated headcount.
3. **What's the total amount needed?** Real number including buffer for fees.
4. **What's the deadline?** When does the money need to be collected and why.
5. **Fixed, tiered, or flexible?** Equal split, different levels (room types, meal options), or suggested amount.

---

## Five Title Options

Score each title on three dimensions:

| Dimension | What to optimize for |
|-----------|---------------------|
| Clarity | Reader understands the situation in under 10 words |
| Emotional impact | Fundraiser: names the person or starts with "Help"/"Support". Event: conveys energy/excitement. Collection: clear purpose. |
| SEO value | Includes searchable terms for the campaign category |

Titles must be under 60 characters. Always include at least one option with the key proper noun (person's name, event name, group name).

**Fundraiser title formulas:**
- "Help [Name] [Situation]": e.g., "Help Maria Cover Her Medical Bills"
- "[Name]'s [Situation] Fund": e.g., "Jake's Legal Defense Fund"
- "Support [Name] Through [Situation]": e.g., "Support the Rivera Family After the Fire"

**Event title formulas:**
- "[Event Name] [Year/Edition]": e.g., "Riverside Reunion 2026"
- "[Group] Annual [Type]": e.g., "Springfield Soccer Club Annual Banquet"
- "[Descriptor] [Event Type]": e.g., "Summer Block Party & Cookout"

**Group title formulas:**
- "[Group Name] [Purpose] Collection": e.g., "Soccer Team Spring Jersey Order"
- "[Group] [Purpose] Fund": e.g., "Johnson Family Reunion Cabin Fund"
- "[Purpose] for [Group]": e.g., "Trip Costs for Class of 2010 Reunion"

Present all 5 options and ask which direction they prefer.

---

## The Full Campaign Description

Use the type-appropriate structure below. Present the draft and ask for feedback.

### Fundraiser: Hook > Person > Situation > Plan > Ask (~150 words)
1. **Hook** (1-2 sentences): Open with the most urgent, emotional fact. Stop the scroll.
2. **Person** (2-3 sentences): Humanize the beneficiary. Name, character, what they mean to people.
3. **Situation** (3-4 sentences): What happened and why funds are needed. Be specific with amounts.
4. **Plan** (2-3 sentences): How the money will be used. Break down the budget simply.
5. **Ask** (1-2 sentences): Direct CTA. "Any amount helps. Please share."

Target 100-150 words. Shorter descriptions convert better than long ones.

### Event: Hook > What/When/Where > Who > Included > Schedule > Logistics (<200 words)
1. **Hook** (1-2 sentences): Most exciting thing about the event. What makes it unmissable?
2. **What / When / Where** (2-3 sentences): Core logistics in plain language.
3. **Who it's for** (1-2 sentences): Help the right people self-select. "Perfect for..."
4. **What's included** (bullet list): Everything the ticket covers.
5. **Schedule / Agenda** (if applicable): Time blocks so attendees can plan.
6. **Logistics** (1-2 sentences): Parking, transit, what to bring.
7. **CTA** (1 sentence): "Grab your tickets before early bird ends."

Use bullet points and headers for scannability. Target under 200 words.

### Group: Purpose > Amount > Deadline > How to Pay (~75 words)
1. **Purpose** (1-2 sentences): What this collection is for, clearly.
2. **Amount** (1-2 sentences): How much each person owes and what it covers.
3. **Deadline** (1 sentence): When payment is due and why (ties to a real constraint).
4. **How to pay** (1 sentence): Direct CTA: "Click the button above to pay your share."

Keep it under 100 words. Collections are transactional: clarity beats storytelling.

---

## Content Formatting Rules

PayIt2 fields fall into two categories. Use the wrong format and the output will display raw tags or broken layout.

### HTML fields (use HTML, never markdown or plain text)
These fields take HTML:
- `description` (the campaign page body, shown in its rich-text editor)
- `save_campaign_story`, `save_update_post` and `save_thank_you` content (shown to the organizer on the campaign's page in their PayIt2 account, so use the same format)

Allowed tags: `<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<br>`, `<a href="">`. Keep it semantic and lean. No inline styles, no `<div>` wrappers, no `<h1>`. Give each paragraph its own `<p>`; the page spaces paragraphs itself, so never add an empty `<p></p>` or a `<br>` to make a gap.

### Plain-text fields (no HTML, no markdown)
These fields render as-is:
- `title`
- `blurb`
- `eventVenueName`, `eventAddress`, `eventCity`, `eventState`
- Option `title` and `description`
- Question `questionText` and `details`
- Any other short label or metadata field

---

## Visual Strategy

### Cover Photo

A campaign created from a template (`templateSlug` on `create_campaign`) shows the template's own cover photo until the organizer adds one, so every templated page has a cover from the start. A custom campaign with no template has none, so prefer a matching template.

**The organizer picks the photo:**

1. In the Step 4 summary, offer a free Unsplash search link built from the campaign, `https://unsplash.com/s/photos/<two-or-three-words>?orientation=landscape&license=free` (for a 5K: running-race), and say how to choose: open a photo, right-click it, "Copy image address", paste it in the chat.
2. Upload only a photo the organizer picked or shared and asked for, via `upload_campaign_image` with its image address (images.unsplash.com for Unsplash; never plus.unsplash.com, a paid license).
3. Never search for, open or fetch photos yourself. The organizer does the choosing.


### What makes a strong cover image

**Fundraiser**: Beneficiary's face. Authentic beats polished. This image appears in every share preview -- it is the first thing potential donors see.

**Event**: Single most compelling photo that conveys energy at thumbnail size. Past event photos showing real crowds outperform generic stock. If no past event photos exist, use a stock image that matches the mood and setting.

**Group**: Group photo or a relevant object (jersey, cabin, trophy). Friendly beats formal.

### Video (fundraisers)
A 60-90 second personal appeal increases donations by up to 4x. Offer to write the script once the story interview is complete.

---

## Goal / Pricing Setup

### Fundraiser Goal Psychology
- Goals under **$5,000** are 2.5x more likely to succeed
- Raising **20-30% in week 1** makes success 80% more likely
- Start conservative, then increase after hitting milestones (social proof accelerates giving)
- Category benchmarks: Legal defense $5K-$25K average; medical $10K-$50K average; emergency $2K-$8K average

Recommend a goal amount using these guidelines and explain the reasoning.

### Event Ticket Type Design
- Design **2-4 tiers** with **20-25% price gaps** between them
- **Early bird**: 25-30% off regular price, first 30% of capacity, 7-14 day window
- **Group discounts**: 5+ tickets = 10% off; 10+ tickets = 15% off; 20+ tickets = 20% off
- Standard structure:

| Tier | Pricing | Purpose |
|------|---------|---------|
| Early Bird | 25-30% off regular | Reward early commitment, generate social proof |
| Regular | Base price | Standard access |
| VIP/Premium | 50-100% above regular | Priority access, perks, exclusivity |

**Free events:** Use a single $0 option (e.g., "Free RSVP" or "General Admission: Free"). Attendees complete registration without entering payment info.

**Add-ons:** Items like T-shirts, parking, or meal upgrades go together in one `pick_any` group titled "Add-ons" (`isRequired: false`), so attendees can add any of them. Do not give each add-on its own group or leave it without a `groupTitle`.

Present a pricing table for the user's event.

### Group Cost Models
- **Fixed split**: Total / headcount = per-person amount. Round up $1-2 to buffer fees.
- **Tiered options**: Different levels for different participation (room types, meal choices, activity packages).
- **Flexible/voluntary**: Set a suggested amount prominently. Best for group gifts.

Calculate the per-person amount and recommend fixed, tiered, or flexible based on their situation. Show the math.

---

## Launch Checklist

Run through the type-specific checklist below. Flag anything missing.

### Fundraiser
- [ ] Title contains a name or specific situation (under 60 chars)
- [ ] Description is under 150 words and formatted as HTML
- [ ] Cover image uploaded (beneficiary's face preferred)
- [ ] Goal is achievable (can be raised later)
- [ ] Category is correctly assigned
- [ ] At least one co-organizer added (3x success rate)
- [ ] SEO keywords appear naturally in the description

### Event
- [ ] Date, time, and timezone are correct
- [ ] Location is complete with address and directions
- [ ] All ticket tiers configured with correct prices and capacities (free options use $0)
- [ ] Registration deadline set if applicable
- [ ] Description under 200 words, formatted as HTML, with hook-details-CTA structure
- [ ] Cover image uploaded and looks good at thumbnail size
- [ ] Payment processing connected and tested
- [ ] Confirmation email content customized
- [ ] Refund/cancellation policy is stated

### Group
- [ ] Title is specific and clear (not "Please Pay")
- [ ] Description states purpose, amount per person, and deadline -- formatted as HTML
- [ ] Cover image uploaded (group photo or relevant object)
- [ ] Goal amount matches total needed
- [ ] Deadline is set to a date with a real constraint
- [ ] At least one co-organizer assigned to help with follow-up

---

## Option groups

How a page shows its options depends on how you group them. Before calling `create_campaign` or `add_campaign_options`, sort every option into a group:

1. **Every option gets a `groupTitle`.** An option without one is shown on its own, and on a fundraiser page each one becomes a separate card marked "Optional". Five amounts then read as five unrelated boxes.
2. **Same kind of choice, same group.** Ticket tiers, giving levels, sponsorship packages, T-shirt sizes and meal choices each go in one group. Never make a group with a single option when its siblings exist.
3. **Different kinds of choice, different groups.** Tickets and add-ons are two groups ("Tickets", "Add-ons"); a race distance and a shirt size are two groups.
4. **Pick the mode by what a person does:**
   - `pick_one`: a person chooses exactly one (a race distance, a sponsorship package, a giving level).
   - `pick_any`: a person may take several (people tiers in one household, add-ons, costs a donor can cover).
5. **Required only when the page cannot work without it.** Tickets for a paid event and a group's dues are required. Giving levels and add-ons pass `isRequired: false`. Leaving `isRequired` out makes the group required.
6. **Group titles are short nouns the participant reads:** "Tickets", "Who's Coming?", "Giving Levels", "What your gift covers", "Sponsorship Levels", "Add-ons", "Shirt Size". Not "Options" or "Group 1".
7. **Send a whole group in one call.** `add_campaign_options` makes a new group for each `groupTitle` it receives, even when the page already has a group with that title. On a live page, call `list_campaign_option_groups` first. To add a choice to a group that already exists, do not call the tool: tell the organizer to add it to that group on the campaign's Options tab.

| Campaign | Groups |
|---|---|
| 5K with shirts | "Registration" (`pick_any`: Adult, Student / Kid), "Add-ons" (`pick_any`, optional: Extra Shirt) |
| Fundraiser | "Giving Levels" (`pick_one`, optional: $25, $50, $100, $250) |
| Medical fundraiser by cost | "What your gift covers" (`pick_any`, optional: Co-pay $25, Therapy session $50, Week of lost income $100) |
| Sponsorships | "Sponsorship Levels" (`pick_one`, optional: Bronze $250, Silver $500, Gold $1,000) |
| Team dues | "Dues" (`pick_one`, required: Full Season, Half Season) |

---

## Options vs. Questions

Default to **options** whenever the organizer needs to count or select something. Questions are for open-ended or personal information only.

| Use an **option** when… | Use a **question** when… |
|------------------------|--------------------------|
| Counting people: adults, kids, guests | Collecting names of guests coming |
| Selecting an item: t-shirt size, meal choice, parking pass | Dietary restrictions or food allergies |
| Choosing a tier: VIP, General, Student | Special accommodations or accessibility needs |
| Any add-on with a quantity: extra shirts, extra tickets | Free-form comments or notes |
| Anything you'd phrase as "how many X" or "which X" | Anything you'd phrase as "tell me about X" |

Apply this heuristic during the interview (Steps 2 to 3): whenever the organizer mentions counting people or selecting items, propose an option group, not a question. Reserve questions for the information that genuinely can't be expressed as a checkbox or quantity.

**T-shirt example:** Use one option per size (Small, Medium, Large, XL, 2XL) at $20 each in a `pick_any` group: attendees use the quantity selector. Do not ask "What size and how many?" as a question.

**Attendee count example:** Use "Adult" and "Child" as free ($0) options in a `pick_any` group called "Who's Coming?": attendees use the quantity selector. Do not ask "How many adults/kids?" as a question.

- `questions`: use sparingly. One question per distinct piece of information needed. Never add two questions that ask for the same thing (e.g. do not add both "Who will be attending?" and "Who will be coming with you?", pick one). If adding questions in multiple calls, call `list_campaign_questions` first to see what already exists and avoid duplicates.

**Question types:** Choose the type that best fits the information being collected.

| `questionType` | When to use | Example |
|---------------|-------------|---------|
| `text` | Short single-line answer | "What is your T-shirt name?" |
| `textarea` | Multi-line or longer answer | "Any special accommodations or notes?" |
| `select` | Pick exactly one from a list (dropdown) | "Meal preference: Chicken / Fish / Vegetarian" |
| `multi_select` | Pick any number from a list | "Which sessions will you attend?" |
| `checkbox` | Single yes/no acknowledgment | "I agree to the waiver" |
| `radio` | Pick exactly one (visible radio buttons) | "Shirt size: S / M / L / XL" |

**Question flags:** Each question supports four boolean settings.

| Flag | Default | Meaning |
|------|---------|---------|
| `isRequired` | `true` | Participant must answer before completing checkout |
| `isPublic` | `false` | Answer is visible on the public campaign page |
| `perGuest` | `false` | Collects a separate answer per guest in the order (events only) |
| `isActive` | `true` | Question appears at checkout. Set `false` to hide without deleting |

Use `perGuest: true` for questions like "What is each attendee's name?" on event registrations where a single payer covers multiple guests.

**Managing questions after creation:** The MCP provides three tools for post-creation question management:
- `list_campaign_questions`: returns all questions with their IDs, types, flags, and any linked option. Always call this before updating or deleting.
- `update_campaign_question`: edits question text, type, choices, flags, or option binding by ID. Supports `paymentOptionTitle` for re-linking to a specific ticket tier.
- `delete_campaign_question`: permanently removes a question by ID.

**To temporarily hide a question** without losing it, use `update_campaign_question` with `isActive: false` rather than deleting it. The organizer can re-enable it later.

---

## The Organizer's Own Photo

A photo goes on the page only when the organizer offers it and says yes to it in the summary. It goes to PayIt2 and nowhere else.

- **A link to the photo** (an https address that opens the image itself): pass it to `upload_campaign_image` as `imageUrl`.
- **A photo pasted into the chat, or a file on their computer:** tell the organizer that PayIt2 needs a link to the photo, or that they can add it themselves on their campaign page in PayIt2 once it is created. Do not move, copy or publish the file anywhere else.

**Do not pre-crop.** The page shows the cover at 3:1 on desktop and 16:9 on phones, and it shows a tall or square photo whole over a blurred copy of itself instead of cropping it. A landscape photo at least 1200 pixels wide fills both shapes best. If the upload reply has a "Heads up" line about size, tell the organizer and ask for a larger photo.

After a successful upload, confirm the image is attached and mention it in the final recap. Never say a photo was uploaded when it wasn't.

---

## Key Statistics

- Co-organizers: **3x more likely** to reach goal
- Video: increases funds raised by **up to 4x**
- Titles with "help": **30% more likely** to succeed (fundraisers)
- Goals under $5,000: **2.5x more likely** to succeed (fundraisers)
- Week-1 momentum (20-30% raised): success **80% more likely** (fundraisers)
- Early bird tiers: sell 30% of capacity before regular pricing opens (events)
- Events promoted 4-6 weeks out: sell **70% more tickets** (events)
- Group discounts: increase average order value **40-60%** (events/groups)

---
