---
name: campaign
description: Create and launch any campaign type on PayIt2 - fundraiser, event, or group
allowed-tools: Read, Write, WebSearch
argument-hint: "[optional: type of campaign or brief description]"
---

# Campaign Creation and Launch

Create a PayIt2 campaign: $ARGUMENTS

Guide organizers through building a high-converting campaign page on PayIt2.com. Works for all three campaign types: fundraisers, events, and groups. Every element (title, description, visuals, goal/pricing) directly impacts whether the campaign reaches its target.

Work through this launch workflow step by step:

---

## Step 1: Identify Campaign Type

If not clear from the arguments, ask: "What are you creating - a fundraiser, an event, or a group?" Use the campaign-context skill to establish type before proceeding.

---

## Step 2: Conduct the Story / Details Interview

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

## Step 3: Generate 5 Title Options

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

## Step 4: Write the Campaign Description

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
These fields back a rich-text editor on the campaign page:
- `description` (campaign page body)
- `save_campaign_story` content
- `save_update_post` content
- `save_thank_you` content

Allowed tags: `<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<br>`, `<a href="">`. Keep it semantic and lean. No inline styles, no `<div>` wrappers, no `<h1>`.

### Plain-text fields (no HTML, no markdown)
These fields render as-is:
- `title`
- `blurb`
- `eventVenueName`, `eventAddress`, `eventCity`, `eventState`
- Option `title` and `description`
- Question `questionText` and `details`
- Any other short label or metadata field

---

## Step 5: Visual Strategy

### Cover Photo (required -- always source and upload during campaign creation)

Templates provide structure only. They never include a cover image. A cover photo must be sourced and uploaded on every campaign before publishing. Do not skip this step or treat it as optional follow-up -- a page without a cover image converts significantly worse.

**Photo sourcing sequence:**

1. Ask: "Do you have a photo you'd like to use? If not, I can find one from a free source."
2. If the user provides a URL or file, upload it directly via `upload_campaign_image`.
3. If no photo is available, search Unsplash using WebSearch or WebFetch:
   - Search query: `site:unsplash.com [keywords matching campaign topic]`
   - Fetch the results page and extract 3-5 specific image src URLs (images.unsplash.com or plus.unsplash.com)
   - Present the options with brief descriptions and let the user pick
   - Upload the chosen image via `upload_campaign_image` using the `imageUrl` parameter

**Unsplash URL format for upload (always add quality params):**
- `https://images.unsplash.com/photo-[ID]?w=1280&q=80`
- `https://plus.unsplash.com/premium_photo-[ID]?w=1280&q=80`

All Unsplash images (including plus.unsplash.com) are free for commercial use under the Unsplash License.

**Search keywords by campaign type:**

| Campaign type | Good search terms |
|---|---|
| Medical / health fundraiser | patient recovery, healthcare support, hospital hope |
| Legal defense fundraiser | courthouse, justice, legal support |
| Emergency / disaster fundraiser | community support, helping hands, rebuilding |
| Event: workshop / conference | workshop collaboration, team learning, professional seminar |
| Event: social / celebration | celebration gathering, community party, event crowd |
| Event: sports / run | race finish line, community run, team sport |
| Collection: group / team | team group photo, club members, community together |

### What makes a strong cover image

**Fundraiser**: Beneficiary's face. Authentic beats polished. This image appears in every share preview -- it is the first thing potential donors see.

**Event**: Single most compelling photo that conveys energy at thumbnail size. Past event photos showing real crowds outperform generic stock. If no past event photos exist, use a stock image that matches the mood and setting.

**Group**: Group photo or a relevant object (jersey, cabin, trophy). Friendly beats formal.

### Video (fundraisers)
A 60-90 second personal appeal increases donations by up to 4x. Offer to write the script once the story interview is complete.

---

## Step 6: Goal / Pricing Setup

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

**Free events:** Use a single $0 option (e.g., "Free RSVP" or "General Admission — Free"). Attendees complete registration without entering payment info.

**Add-ons:** Items like T-shirts, parking, or meal upgrades should be separate options with `pick_any` so attendees can add them independently.

Present a pricing table for the user's event.

### Group Cost Models
- **Fixed split**: Total / headcount = per-person amount. Round up $1-2 to buffer fees.
- **Tiered options**: Different levels for different participation (room types, meal choices, activity packages).
- **Flexible/voluntary**: Set a suggested amount prominently. Best for group gifts.

Calculate the per-person amount and recommend fixed, tiered, or flexible based on their situation. Show the math.

---

## Step 7: Pre-Publish Checklist

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

## Step 8: Create the Campaign on PayIt2

If the PayIt2 MCP server is connected, follow the MCP-Enhanced Flow below. This creates the campaign, its ticket options, registration deadline, and cover image in one session — no manual setup required.

If MCP is not connected, direct the organizer to sign up or log in at payit2.com to create their campaign. Share the finalized title, description, goal, and pricing so they can paste it in when setting up their campaign page on PayIt2.

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

## Additional Resources

- **`references/story-templates.md`** - Category-specific story templates for fundraisers, events, and collections
- **`references/title-formulas.md`** - Proven title patterns with scoring rubric for all types
- **`references/ticket-strategy.md`** - Ticket tier templates, pricing formulas, group discount structures
- **`references/cost-splitting-guide.md`** - Fixed split calculator, tiered examples, fee transparency, overages

---

## If the PayIt2 MCP server is connected

If the `payit2` MCP server is configured in this session (you will see tools like `list_my_campaigns`, `create_campaign`, and `save_campaign_story`), use the enhanced flow below. This is the preferred path - it creates the campaign directly on PayIt2 without any manual copy-paste.

If MCP is not available, complete Steps 1-7 as normal, then at Step 8 direct the organizer to payit2.com to create their campaign and paste in the finalized content.

### MCP-Enhanced Flow

After completing Steps 1-7:

1. **Check for templates.** Before creating, call `list_templates` and filter results by the campaign's `mode`. If any templates match the campaign type or category, present them briefly:

   > "PayIt2 has a **[Template Name]** template that includes pre-built ticket options and questions for [category]. Want to start from that, or build a custom one from scratch?"

   If the organizer picks a template, note its `slug` for use in the next step — the template's options and questions are cloned automatically, so you can skip building them manually in Step 2. If no templates match or the organizer prefers custom, proceed without a `templateSlug`.

2. **Ask for confirmation.** "Ready to create this campaign on your PayIt2 account?"

3. **Create the campaign.** Call `create_campaign` with all finalized details. Always include:
   - `title`, `mode`, `description`, `blurb`
   - `publish` (default `false` — creates as draft)

   Add these based on campaign type:

   **Fundraiser:**
   - `goalAmount` (dollars)

   **Event (registration):**
   - `eventStartDate`, `eventEndDate` (ISO 8601)
   - `eventVenueName`, `eventAddress`, `eventCity`, `eventState`, `eventZipCode`
   - `registrationDeadline` (ISO 8601) if a cutoff date was set
   - `options` — build from the ticket tiers decided in Step 6:
     - Ticket tiers go in a group: `groupTitle: "Tickets"`, `groupMode: "pick_one"`, `isRequired: true`
     - Free RSVP: `{ title: "General Admission", amount: 0, groupTitle: "Tickets", groupMode: "pick_one", isRequired: true }`
     - Add-ons (T-shirt, parking, meal): separate group with `groupMode: "pick_any"`, `isRequired: false`
     - **Platform note:** PayIt2 renders a built-in quantity selector for every option. Do NOT add `questions` to collect quantity for options (e.g. "How many Medium T-shirts?") — this creates redundant fields. Only use questions for information the option selector cannot capture (e.g. size preferences, names, dietary restrictions).

   **Options vs. Questions — best practices:**

   Default to **options** whenever the organizer needs to count or select something. Questions are for open-ended or personal information only.

   | Use an **option** when… | Use a **question** when… |
   |------------------------|--------------------------|
   | Counting people — adults, kids, guests | Collecting names of guests coming |
   | Selecting an item — t-shirt size, meal choice, parking pass | Dietary restrictions or food allergies |
   | Choosing a tier — VIP, General, Student | Special accommodations or accessibility needs |
   | Any add-on with a quantity — extra shirts, extra tickets | Free-form comments or notes |
   | Anything you'd phrase as "how many X" or "which X" | Anything you'd phrase as "tell me about X" |

   Apply this heuristic during the interview (Steps 2–3): whenever the organizer mentions counting people or selecting items, propose an option group — not a question. Reserve questions for the information that genuinely can't be expressed as a checkbox or quantity.

   **T-shirt example:** Use one option per size (Small, Medium, Large, XL, 2XL) at $20 each in a `pick_any` group — attendees use the quantity selector. Do not ask "What size and how many?" as a question.

   **Attendee count example:** Use "Adult" and "Child" as free ($0) options in a `pick_any` group called "Who's Coming?" — attendees use the quantity selector. Do not ask "How many adults/kids?" as a question.

   - `questions` — use sparingly. One question per distinct piece of information needed. Never add two questions that ask for the same thing (e.g. do not add both "Who will be attending?" and "Who will be coming with you?" — pick one). If adding questions in multiple calls, call `list_campaign_questions` first to see what already exists and avoid duplicates.

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
   | `isActive` | `true` | Question appears at checkout — set `false` to hide without deleting |

   Use `perGuest: true` for questions like "What is each attendee's name?" on event registrations where a single payer covers multiple guests.

   **Managing questions after creation:** The MCP provides three tools for post-creation question management:
   - `list_campaign_questions` — returns all questions with their IDs, types, flags, and any linked option. Always call this before updating or deleting.
   - `update_campaign_question` — edits question text, type, choices, flags, or option binding by ID. Supports `paymentOptionTitle` for re-linking to a specific ticket tier.
   - `delete_campaign_question` — permanently removes a question by ID.

   **To temporarily hide a question** without losing it, use `update_campaign_question` with `isActive: false` rather than deleting it. The organizer can re-enable it later.

   **Group payment:**
   - `goalAmount` (total needed)
   - `options` — use for tiered amounts (room types, meal choices, activity levels). Standalone if just one price.

   Save the campaign ID and URL from the response.

4. **Upload cover image (required).** If the organizer provided a photo, use it. If not, proactively search Unsplash (see Step 5 sourcing sequence), present 3-5 options, and upload the chosen one -- do not skip this or leave the campaign without a cover. The `upload_campaign_image` tool accepts either `imageUrl` (preferred) or `imageBase64`. Always prefer `imageUrl` - base64 payloads blow past the ~25K token Read limit for anything above ~300KB, while any public URL is fetched server-side with no size penalty.

   **Before you upload, verify the source is actually high-resolution:**
   ```bash
   sips -g pixelWidth -g pixelHeight "<file>"
   ```
   File size is a misleading proxy for photos. An iMessage/AirDrop preview can be 600KB+ on disk but only 640×480 pixels - PNG lossless compression bloats the byte count without adding detail. If dimensions are under ~1600 wide, ask the organizer for the original (Photos > File > Export > Export Unmodified Original, or the full-size version from iCloud). Multiple `IMG_1234.png`, `IMG_1234 (1).png`, `IMG_1234 (2).png` in Downloads often means the biggest number is the full-res.

   **Pre-crop to the display aspect ratio (3:1) before upload.** Event/fund/group cover containers on the public page are `aspect-[3/1]` with `object-cover`. A 4:3 or 16:9 source loses 40-55% of its pixels to the center-strip crop and has to scale up to fill the wider container, which looks soft. Cropping to 3:1 up front preserves composition and keeps every pixel on screen. Use Python/PIL for offset crops (sips only crops centered):
   ```python
   from PIL import Image
   img = Image.open('source.png')
   W, H = img.size
   target_h = W // 3
   y0 = max(0, (H - target_h) // 2 - 200)  # bias slightly toward top to keep sky
   img.crop((0, y0, W, y0 + target_h)).convert('RGB').save('cover.jpg', 'JPEG', quality=92, optimize=True)
   ```

   **Pathways by how the image was shared:**
   - **File path on disk** (e.g. `~/Downloads/hero.jpg`): verify dimensions, pre-crop, then push the result to a temp location the MCP can fetch (a public GitHub raw URL works well - use the `payit2-plugins-marketplace` repo's `tmp-assets/` folder, then clean up with a follow-up commit). Pass as `imageUrl`. Only fall back to `imageBase64` if the file is already under ~300KB.
   - **Public URL** (Slack CDN, Google Drive share link, S3): pass directly as `imageUrl`, but still verify dimensions first with a `curl | sips` round-trip if quality matters.
   - **Inline image pasted in chat:** you can see it visually but the bytes are NOT on disk and NOT accessible to you. Do not silently skip it. Tell the organizer exactly one of:
     1. "Drag the image from this chat to your Downloads folder and tell me the filename."
     2. "If it's already hosted anywhere (Slack, Drive, a website), paste the URL."

     Then proceed with whichever path they choose. Never claim the image was uploaded when it wasn't.

   **Gotchas:** git pushes of files over ~1MB can fail with HTTP 400 `send-pack: unexpected disconnect`. Either keep the JPEG under ~1.5MB (quality 88, max 1800 wide is usually safe) or bump `git config http.postBuffer 524288000` before pushing. After upload, verify the result with `curl -sI <cover-url>` and `sips -g pixelWidth -g pixelHeight` - backend resizes to max 1600x900 fit:inside, so a well-prepped 3:1 crop comes out at 1600x533.

   After a successful upload, confirm the image is attached and mention it in the final recap.

5. **Save the campaign story.** Use the `campaign_story` prompt to generate a polished story, then call `save_campaign_story` with the campaign ID to persist it.

6. **Confirm success.** Share the campaign URL from the `create_campaign` response. Let the organizer know the campaign is live as a draft and remind them to review and publish when ready.
