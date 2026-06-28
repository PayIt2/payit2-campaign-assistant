---
title: "Campaign Assistant v1.0.0 Implementation Plan"
type: reference
doc_status: active
owner: claude-maintained
---
# Campaign Assistant v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Campaign Assistant plugin from fundraising-first to a unified platform supporting fundraisers, events, and group collections across all commands, skills, and agents.

**Architecture:** 4 unified commands → 5 type-adaptive skills → 3 agents. Every component branches on campaign type internally rather than having separate type-specific components. A new `campaign-context` skill handles all context-gathering conversationally (no MCP this release).

**Tech Stack:** Claude plugin markdown files (SKILL.md, command .md, agent .md), plugin.json manifest, build-plugin.sh zip builder.

---

## File Map

### Create (new files)
- `plugin/skills/campaign-context/SKILL.md`
- `plugin/skills/campaign-creation/references/ticket-strategy.md`
- `plugin/skills/campaign-creation/references/cost-splitting-guide.md`
- `plugin/skills/supporter-engagement/references/reminder-templates.md`
- `plugin/commands/campaign.md`
- `plugin/commands/promote.md`
- `plugin/commands/check-in.md`
- `plugin/commands/engage.md`
- `plugin/agents/supporter-outreach.md`

### Rewrite (replace full content)
- `plugin/skills/campaign-creation/SKILL.md`
- `plugin/skills/campaign-creation/references/story-templates.md`
- `plugin/skills/campaign-creation/references/title-formulas.md`
- `plugin/skills/campaign-promotion/SKILL.md`
- `plugin/skills/campaign-promotion/references/post-templates.md`
- `plugin/skills/campaign-promotion/references/email-sequences.md`
- `plugin/skills/campaign-analytics/SKILL.md`
- `plugin/skills/campaign-analytics/references/benchmark-data.md`
- `plugin/skills/campaign-analytics/references/optimization-checklist.md`
- `plugin/skills/supporter-engagement/SKILL.md`
- `plugin/skills/supporter-engagement/references/thank-you-templates.md`
- `plugin/skills/supporter-engagement/references/update-templates.md`
- `plugin/agents/campaign-assistant.md`
- `plugin/agents/content-generator.md`
- `plugin/.claude-plugin/plugin.json`

### Delete
- `plugin/skills/event-management/` (entire folder)
- `plugin/skills/group-collection/` (entire folder)
- `plugin/commands/launch-fundraiser.md`
- `plugin/commands/plan-event.md`
- `plugin/commands/collect-from-group.md`
- `plugin/commands/boost-campaign.md`
- `plugin/commands/thank-donors.md`
- `plugin/commands/weekly-checkin.md`
- `plugin/agents/donor-outreach.md`
- `plugin/agents/event-promoter.md`
- `plugin/agents/group-collector.md`
- `plugin/agents/seo-optimizer.md`

---

## Task 1: Create campaign-context skill

**Files:**
- Create: `plugin/skills/campaign-context/SKILL.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: campaign-context
description: >
  Shared context-gathering engine used by all Campaign Assistant commands. Use when
  starting any campaign interaction to determine campaign type and collect the
  minimum information needed for the current task. Triggers automatically at the
  start of every /campaign, /promote, /check-in, and /engage command.
version: 1.0.0
---

# Campaign Context

Gather the minimum context needed for the current command through natural conversation. Never ask for more than what the current task requires.

## Context Model

| Field | Needed By | Notes |
|-------|-----------|-------|
| Campaign type (fundraiser / event / collection) | All commands | Always required first |
| Title | All commands | Required |
| URL (if live) | /promote, /check-in, /engage | Optional — extract what you can from URL structure |
| Goal / target amount | /campaign, /check-in | Required for fundraiser and collection |
| Ticket tiers / pricing | /campaign, /check-in | Required for events |
| Current progress (amount raised / tickets sold / payments received) | /check-in, /engage | Required for check-in |
| Days active / days until deadline or event | /check-in, /promote | Required for check-in |
| Audience description | /promote, /campaign | Optional |
| Channels used so far | /promote, /check-in | Optional |
| Group size | /campaign, /check-in | Required for collections |

## Context-Gathering Rules

1. **Type first.** Always establish campaign type before asking anything else. Ask: "What are you working on — a fundraiser, an event, or a group collection?"

2. **Minimum viable context.** Ask only what the current command needs. /promote needs type + title + what's been tried. /engage needs type + what action the user wants to take. Don't ask for a full data dump.

3. **Accept a URL shortcut.** If the user provides a PayIt2 page URL, acknowledge it and ask for the 1-2 things the URL can't tell you (e.g., current progress stats for /check-in).

4. **Use what's in the conversation.** If campaign type and title were established earlier in the conversation, don't ask again. Reference what you already know: "Got it — continuing with your [title] [type]."

5. **One question at a time.** Never ask multiple questions in one message. Pick the most important unknown and ask just that.

## Context Questions by Command

### /campaign (Create & Launch)
Required: campaign type, then branch into type-specific story interview (see campaign-creation skill).

### /promote (Drive Traffic)
Ask in order, stopping when you have enough:
1. "Tell me about your campaign — what type is it and what's the title?"
2. "Do you have a PayIt2 URL for it yet?"
3. "How long has it been live and what promotion have you tried so far?"

### /check-in (Health Check)
Ask in order:
1. "What type of campaign is it and what's the title?"
2. Then by type:
   - **Fundraiser:** "Share your current numbers — amount raised, number of donors, and how many days it's been live."
   - **Event:** "Share your numbers — tickets sold, total capacity, and how many days until the event."
   - **Collection:** "Share your numbers — how many people have paid, total group size, and days until the deadline."
3. "What channels have you been using to promote it?"

### /engage (Supporter Relationships)
1. "What type of campaign is it?"
2. "What would you like to do — thank supporters, post an update, re-engage lapsed supporters, or ask for shares?"
3. Follow up with only what's needed for that action.

## MCP-Readiness Note

This skill is the adapter layer for a future MCP integration. When a PayIt2 MCP server is added, this skill will query it for campaign data instead of prompting the user. All other skills remain unchanged — they receive context the same way regardless of source.
```

- [ ] **Step 2: Verify file created**

```bash
ls plugin/skills/campaign-context/SKILL.md
```
Expected: file listed.

- [ ] **Step 3: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/campaign-context/SKILL.md
git commit -m "feat: add campaign-context skill — shared context-gathering engine"
```

---

## Task 2: Rewrite campaign-creation SKILL.md

**Files:**
- Modify: `plugin/skills/campaign-creation/SKILL.md`

- [ ] **Step 1: Overwrite the file**

```markdown
---
name: campaign-creation
description: >
  This skill should be used when the user asks to "create a campaign", "start a
  fundraiser", "set up an event", "collect from my group", "write a campaign
  story", "set up my PayIt2 page", "help me write my description", "optimize my
  campaign title", "what should my goal be", "set up ticket tiers", "how should
  I split costs", or needs guidance on building a campaign page for any type on
  PayIt2. Also triggers on "campaign setup", "fundraiser page", "event page",
  "story writing", "campaign description", "campaign goal", "create a page",
  "ticket pricing", "cost split", or "new campaign".
version: 1.0.0
---

# Campaign Creation

Guide organizers through building a high-converting campaign page on PayIt2.com. Works for all three campaign types: fundraisers, events, and group collections. Every element — title, description, visuals, goal/pricing — directly impacts whether the campaign reaches its target.

## Step 1: Story / Details Interview

Conduct a structured interview adapted to campaign type. Ask questions one at a time, building on each answer.

### Fundraiser Interview
1. **Who needs help?** Name, relationship, one humanizing detail.
2. **What happened?** The specific situation in their own words.
3. **What do the funds cover?** Specific, tangible line items (medical bills, legal fees, rent).
4. **What's the timeline?** Urgency — court dates, medical deadlines, eviction notices.
5. **What happens without help?** The stakes and consequences.
6. **Who is already helping?** Co-organizers, community support, existing efforts.

### Event Interview
1. **What type of event is it?** Category (conference, party, concert, reunion, etc.) and brief description.
2. **When and where?** Date, start/end time, timezone, venue name and address (or virtual platform).
3. **What's the capacity?** Max attendees. Separate by tier if applicable.
4. **What will attendees experience?** Agenda, speakers, activities, food/drink, entertainment.
5. **What do attendees need to know?** Dress code, what to bring, accessibility, age restrictions, refund policy.

### Collection Interview
1. **What's the collection for?** Specific purpose — team jerseys, cabin rental, birthday gift, club dues, etc.
2. **How many people are in the group?** Exact or estimated headcount.
3. **What's the total amount needed?** Real number including buffer for fees.
4. **What's the deadline?** When does the money need to be collected and why.
5. **Fixed, tiered, or flexible?** Equal split, different levels (room types, meal options), or suggested amount.

## Step 2: Title Generation

Generate 5 title options scored on three dimensions:

| Dimension | What to optimize for |
|-----------|---------------------|
| Clarity | Reader understands the situation in under 10 words |
| Emotional impact | For fundraisers: names the person or starts with "Help"/"Support". For events: conveys energy/excitement. For collections: clear purpose. |
| SEO value | Includes searchable terms for the campaign category |

Titles must be under 60 characters. Always include at least one option with the key proper noun (person's name, event name, group name).

**Fundraiser title formulas:**
- "Help [Name] [Situation]" — e.g., "Help Maria Cover Her Medical Bills"
- "[Name]'s [Situation] Fund" — e.g., "Jake's Legal Defense Fund"
- "Support [Name] Through [Situation]" — e.g., "Support the Rivera Family After the Fire"

**Event title formulas:**
- "[Event Name] [Year/Edition]" — e.g., "Riverside Reunion 2026"
- "[Group] Annual [Type]" — e.g., "Springfield Soccer Club Annual Banquet"
- "[Descriptor] [Event Type]" — e.g., "Summer Block Party & Cookout"

**Collection title formulas:**
- "[Group Name] [Purpose] Collection" — e.g., "Soccer Team Spring Jersey Order"
- "[Group] [Purpose] Fund" — e.g., "Johnson Family Reunion Cabin Fund"
- "[Purpose] for [Group]" — e.g., "Trip Costs for Class of 2010 Reunion"

## Step 3: Description Writing

### Fundraiser: Hook → Person → Situation → Plan → Ask (~150 words)
1. **Hook** (1-2 sentences): Open with the most urgent, emotional fact. Stop the scroll.
2. **Person** (2-3 sentences): Humanize the beneficiary. Name, character, what they mean to people.
3. **Situation** (3-4 sentences): What happened and why funds are needed. Be specific with amounts.
4. **Plan** (2-3 sentences): How the money will be used. Break down the budget simply.
5. **Ask** (1-2 sentences): Direct CTA. "Any amount helps. Please share."

Target 100-150 words. Shorter descriptions convert better than long ones.

### Event: Hook → What/When/Where → Who → Included → Schedule → Logistics (<200 words)
1. **Hook** (1-2 sentences): Most exciting thing about the event. What makes it unmissable?
2. **What / When / Where** (2-3 sentences): Core logistics in plain language.
3. **Who it's for** (1-2 sentences): Help the right people self-select. "Perfect for..."
4. **What's included** (bullet list): Everything the ticket covers.
5. **Schedule / Agenda** (if applicable): Time blocks so attendees can plan.
6. **Logistics** (1-2 sentences): Parking, transit, what to bring.
7. **CTA** (1 sentence): "Grab your tickets before early bird ends."

Use bullet points and headers for scannability. Target under 200 words.

### Collection: Purpose → Amount Breakdown → Deadline → How to Pay (~75 words)
1. **Purpose** (1-2 sentences): What this collection is for, clearly.
2. **Amount** (1-2 sentences): How much each person owes and what it covers.
3. **Deadline** (1 sentence): When payment is due and why (ties to a real constraint).
4. **How to pay** (1 sentence): Direct CTA — "Click the button above to pay your share."

Keep it under 100 words. Collections are transactional — clarity beats storytelling.

## Step 4: Visual Strategy

### Fundraiser
- **Primary photo**: Beneficiary's face. Authentic > polished. Appears in every share preview.
- **Supporting photos**: Before/after, family moments, community support.
- **Video**: 60-90 second personal appeal increases donations by up to 4x. Offer to write the script.

### Event
- **Hero image**: Single most compelling photo or graphic. Must convey energy at thumbnail size.
- **Event photos**: Past event photos showing crowds and real moments.
- **Venue photos**: Help attendees visualize where they're going.
- **Branded graphics**: Date and location on every graphic.
- **Speaker/performer headshots**: If lineup sells the event, show the faces.

### Collection
- **Hero image**: Group photo or relevant visual (jersey, cabin, trophy). Friendly > formal.
- Keep visuals simple — collections are functional. Don't over-invest in production.

## Step 5: Goal / Pricing Setup

### Fundraiser Goal Psychology
- Goals under **$5,000** are 2.5x more likely to succeed
- Raising **20-30% in week 1** makes success 80% more likely
- Start conservative — can always increase after hitting milestones (social proof accelerates)
- Compare to category: Legal defense $5K-$25K average; medical $10K-$50K average; emergency $2K-$8K average

### Event Ticket Tier Design
- Design **2-4 tiers** with **20-25% price gaps** between them
- **Early bird**: 25-30% off regular price, first 30% of capacity, 7-14 day window
- **Group discounts**: 5+ tickets = 10% off; 10+ tickets = 15% off; 20+ tickets = 20% off
- Standard structure:

| Tier | Pricing | Purpose |
|------|---------|---------|
| Early Bird | 25-30% off regular | Reward early commitment, generate social proof |
| Regular | Base price | Standard access |
| VIP/Premium | 50-100% above regular | Priority access, perks, exclusivity |

### Collection Cost Models
- **Fixed split**: Total ÷ headcount = per-person amount. Round up $1-2 to buffer fees.
- **Tiered options**: Different levels for different participation (room types, meal choices, activity packages).
- **Flexible/voluntary**: Set a suggested amount prominently. Best for group gifts.

## Step 6: Pre-Publish Checklist

### Fundraiser
- [ ] Title contains a name or specific situation (under 60 chars)
- [ ] Description is under 150 words
- [ ] Primary photo shows a face
- [ ] Goal is achievable (can be raised later)
- [ ] Category is correctly assigned
- [ ] At least one co-organizer added (3x success rate)
- [ ] SEO keywords appear naturally in the description

### Event
- [ ] Date, time, and timezone are correct
- [ ] Location is complete with address and directions
- [ ] All ticket tiers configured with correct prices and capacities
- [ ] Description under 200 words with hook-details-CTA structure
- [ ] Hero image uploaded and looks good at thumbnail size
- [ ] Payment processing connected and tested
- [ ] Confirmation email content customized
- [ ] Refund/cancellation policy is stated

### Collection
- [ ] Title is specific and clear (not "Please Pay")
- [ ] Description states purpose, amount per person, and deadline
- [ ] Goal amount matches total needed
- [ ] Deadline is set to a date with a real constraint
- [ ] At least one co-organizer assigned to help with follow-up

## Key Statistics

- Co-organizers: **3x more likely** to reach goal
- Video: increases funds raised by **up to 4x**
- Titles with "help": **30% more likely** to succeed (fundraisers)
- Goals under $5,000: **2.5x more likely** to succeed (fundraisers)
- Week-1 momentum (20-30% raised): success **80% more likely** (fundraisers)
- Early bird tiers: sell 30% of capacity before regular pricing opens (events)
- Events promoted 4-6 weeks out: sell **70% more tickets** (events)
- Group discounts: increase average order value **40-60%** (events/collections)

## Additional Resources

- **`references/story-templates.md`** — Category-specific story templates for fundraisers, events, and collections
- **`references/title-formulas.md`** — Proven title patterns with scoring rubric for all types
- **`references/ticket-strategy.md`** — Ticket tier templates, pricing formulas, group discount structures
- **`references/cost-splitting-guide.md`** — Fixed split calculator, tiered examples, fee transparency, overages
```

- [ ] **Step 2: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/campaign-creation/SKILL.md
git commit -m "feat: rewrite campaign-creation skill for all campaign types"
```

---

## Task 3: Add ticket-strategy.md and cost-splitting-guide.md to campaign-creation

**Files:**
- Create: `plugin/skills/campaign-creation/references/ticket-strategy.md`
- Create: `plugin/skills/campaign-creation/references/cost-splitting-guide.md`

These files already exist under the old skills. Copy and expand them.

- [ ] **Step 1: Create ticket-strategy.md**

```markdown
# Ticket Strategy

Tier structure, pricing formulas, and group discount models for event campaigns on PayIt2.

## Tier Design Principles

Design 2-4 tiers with 20-25% price gaps. The gap must feel meaningful (worth upgrading) but not so large that regular tickets feel inadequate.

### Minimum Viable Tier Structure (2 tiers)
| Tier | Price | Allocation |
|------|-------|-----------|
| Early Bird | 70-75% of regular price | First 25-30% of capacity |
| Regular | Base price | Remaining capacity |

### Standard Tier Structure (3 tiers)
| Tier | Price | Allocation | What's included |
|------|-------|-----------|----------------|
| Early Bird | 70-75% of regular | First 30% of capacity | Same access, reward for commitment |
| Regular | Base price | Core capacity | Standard event access |
| VIP | 150-200% of regular | 10-15% of capacity | Priority seating, exclusive perks |

### Full Tier Structure (4 tiers)
| Tier | Price example (base $100) | Notes |
|------|--------------------------|-------|
| Early Bird | $70 | 7-14 day window only |
| Regular | $100 | Core offering |
| VIP | $150 | Premium access |
| Table / Group | $400 (5 seats) | ~20% discount for groups |

## Early Bird Strategy

- **Discount**: 25-30% off regular price
- **Allocation**: First 25-30% of total capacity
- **Window**: 7-14 days from announcement
- **Urgency messaging**: Show exact count ("47 of 100 early bird spots remaining")
- **Purpose**: Generates early revenue + social proof that drives regular sales

## Group Discount Structure

| Group size | Discount per ticket |
|-----------|-------------------|
| 5-9 tickets | 10% off |
| 10-19 tickets | 15% off |
| 20+ tickets | 20% off |

Group discounts turn one buyer into a table, a team, or a section. Always offer them — the volume makes up for the discount.

## Pricing Formulas

**Cost-plus pricing** (for revenue events):
> Minimum viable ticket price = (Total costs ÷ Expected attendance) × 1.3 (30% margin)

**Market-rate pricing** (for social/community events):
> Research 3 comparable events in your area. Price Early Bird 20% below the median, Regular at median, VIP 50% above.

**Break-even check**:
> Break-even point = Fixed costs ÷ (Ticket price - Variable cost per attendee)

## Template: Reunion Event
- Early Bird (first 30 days): $45
- Regular: $65
- VIP (includes dinner seating + keepsake): $95
- Table of 8 (regular): $440 (~$55/person, ~15% group discount)

## Template: Conference/Workshop
- Early Bird (first 2 weeks): $149
- Regular: $199
- VIP (front row + networking dinner + recording): $299
- Group (5+): 15% off per ticket

## Template: Community Party/Fundraiser
- Early Bird (first week): $25
- Regular: $35
- VIP (premium open bar + priority entry): $55

## Key Statistics
- Early bird tiers: **30% of capacity** sold before regular pricing opens
- BOGO offers: **2.2x more tickets** than standard pricing
- Group discounts: increase average order value by **40-60%**
- Events with 2+ tiers: **35% higher revenue** than single-price events
```

- [ ] **Step 2: Create cost-splitting-guide.md**

```markdown
# Cost-Splitting Guide

Models, formulas, and fee transparency guidance for group collection campaigns on PayIt2.

## The Three Models

### Model 1: Fixed Per-Person Split
Everyone pays the same amount. Best for dues, equal-benefit expenses, uniform orders.

**Formula**: Total cost ÷ group size = per-person amount. Round UP to the nearest dollar.

| Total Cost | Group Size | Per Person (exact) | Per Person (rounded up) |
|-----------|-----------|-------------------|------------------------|
| $500 | 10 | $50.00 | $50 |
| $720 | 12 | $60.00 | $60 |
| $1,100 | 15 | $73.33 | $74 |
| $2,400 | 20 | $120.00 | $120 |
| $3,500 | 28 | $125.00 | $125 |

**Buffer recommendation**: Add $2-5 per person to cover PayIt2 processing fees and potential no-shows. If you collect a surplus, return it or roll it to the next collection — never quietly keep it.

### Model 2: Tiered Options
Different levels for different participation. Best for trips with room choices, events with meal options, equipment with size/quantity variations.

**Example — Weekend Trip:**
- Shared room (2-3 per room): $150/person
- Private room: $250/person
- Day-tripper (no overnight): $75/person

**Example — Club Dinner:**
- Standard meal: $45/person
- Vegetarian meal: $45/person
- Meal + open bar: $70/person

Set each tier as a separate payment option on the collection page with clear, unambiguous labels.

### Model 3: Flexible / Voluntary
Suggested amount with room to adjust. Best for group gifts, community projects, optional contributions.

**How to set it up:**
- State the suggested amount prominently in the description: "We're suggesting $25 per person."
- Set the page goal to the full amount (suggested amount × group size).
- Leave payment amount open so contributors can give more or less.
- Never pressure people who give less than suggested.

## Fee Transparency

Always be upfront about PayIt2's processing fees. Include one of these in your collection description:

> "The collection goal of $X includes a small amount to cover payment processing fees."

> "Per-person amount is $Y. This includes a $1-2 buffer to cover transaction fees."

Contributors hate surprise fees. Transparency prevents friction and complaints.

## Handling Overages

If you collect more than needed:
1. **Announce the surplus** to the group: "We hit $1,340 — $40 over our goal!"
2. **Options**: (a) Roll to next collection, (b) reduce everyone's balance proportionally, (c) donate the remainder to a related cause, (d) cover incidentals without asking for more money.
3. **Never keep it silently.** Trust is the organizer's most valuable asset.

## Handling Shortfalls

If the deadline passes and you're short:
1. **Assess the gap**: Is it 5% short or 30% short? Different responses.
2. **Small gap (<10%)**: Absorb it if possible, or ask the group once to cover the difference.
3. **Large gap (>10%)**: Renegotiate with the vendor, reduce scope, or extend the deadline with a clear explanation to the group.
4. **Non-payers**: Follow up via private message only. Never name non-payers to the group.

## Best Practices

1. **Pay your own share first.** Sets the norm, demonstrates commitment.
2. **Show the math.** Break down exactly what the money covers. Transparency drives participation.
3. **Round amounts to clean numbers.** $53.33 per person creates friction. $55 doesn't.
4. **Build in a buffer.** Better to return money than beg for more.
5. **Set deadlines with real constraints.** "Booking closes Friday" beats "please pay soon."
6. **Name the deadline in the title or description.** It gets attention.

## Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| No stated deadline | Slow payment rate | Tie deadline to a real booking or order cutoff |
| Exact split with no buffer | Shortfall from fees | Round up $1-2 per person |
| Vague description | Confusion, complaints | Itemize costs in the description |
| Too many reminders | Annoys the group | Max 5-6 messages total to full group |
| Public call-outs of non-payers | Damages relationships | Private follow-up only, after deadline |
```

- [ ] **Step 3: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/campaign-creation/references/ticket-strategy.md
git add plugin/skills/campaign-creation/references/cost-splitting-guide.md
git commit -m "feat: add ticket-strategy and cost-splitting-guide to campaign-creation"
```

---

## Task 4: Rewrite campaign-promotion SKILL.md

**Files:**
- Modify: `plugin/skills/campaign-promotion/SKILL.md`

- [ ] **Step 1: Overwrite the file**

```markdown
---
name: campaign-promotion
description: >
  This skill should be used when the user asks to "promote my campaign", "share
  my fundraiser", "promote my event", "create social media posts", "build a
  content calendar", "schedule posts", "write emails for my campaign", "how do I
  get more donations", "sell more tickets", "increase visibility", "campaign
  marketing", "share my fundraiser", or needs multi-channel promotion guidance
  for fundraisers, events, or group collections on PayIt2. Also triggers on
  "social media strategy", "campaign sharing", "email outreach", "press release",
  "community posting", or "event promotion".
version: 1.0.0
---

# Campaign Promotion

Guide organizers through multi-channel promotion for any campaign type. Under-promotion is the #1 reason campaigns fail. This skill turns promotion into a systematic process regardless of whether you're running a fundraiser, event, or group collection.

## Core Principle: The 2.5x Rule

Each new sharing method used leads to a **2.5x increase in campaign visibility**. Organizers who share through 6+ methods receive **3x more engagement**. Maximize channel diversity and posting frequency.

## Channel Priority by Campaign Type

### Fundraiser: Lead with Personal Networks
| Channel | Priority | Why |
|---------|----------|-----|
| Facebook | High | Broad reach, emotional content performs well |
| Personal text/WhatsApp | High | Highest conversion rate (inner circle) |
| Email | High | Best per-contact conversion for direct asks |
| Instagram | Medium | Visual storytelling, younger demographics |
| TikTok | Medium | Viral potential for emotional stories |
| Twitter/X | Medium | News-driven, legal/political causes |
| Nextdoor | Low-Medium | Local causes, neighborhood impact |
| LinkedIn | Low | Professional networks, legal defense cases |

### Event: Lead with Social Discovery
| Channel | Priority | Why |
|---------|----------|-----|
| Instagram | High | Visual, shareable, event discovery |
| Facebook Events | High | Native event feature, community reach |
| TikTok | High | Countdown content, FOMO, viral potential |
| Email | High | Confirmed buyers share more after registration |
| Community boards | Medium | Nextdoor, local Facebook Groups |
| LinkedIn | Medium | Professional/industry events |
| Partner cross-promotion | High | Other organizations with same audience |

### Collection: Lead with Direct Messaging
| Channel | Priority | Why |
|---------|----------|-----|
| Group text / WhatsApp group | High | Where the group already communicates |
| Email | High | Formal, easy to reply and ask questions |
| Slack / Teams | High | Work or club groups |
| Facebook Group | Medium | If the group has one |
| Social media | Low | Collections are private; public posts have low ROI |

## Content Calendar Frameworks

### Fundraiser: 4 Phases over 30 Days

**Phase 1 — Launch Blitz (Days 1-3)**
- Day 1 AM: Announcement on all primary channels
- Day 1 PM: Personal text/WhatsApp to inner circle (10-20 people)
- Day 1 Evening: Email blast to full contact list
- Day 2: Video content — personal appeal or behind-the-scenes
- Day 3: First thank-you post (gratitude to early donors)

**Phase 2 — Momentum (Days 4-14)**
- 3x/week social posts with rotating content angles
- Weekly email update to supporters
- Milestone celebrations (25%, 50% progress)
- Re-share requests to existing donors

**Phase 3 — Sustain & Expand (Days 15-25)**
- Fresh storytelling angles (impact stories, new photos)
- Community cross-posting (local groups, relevant forums)
- Press outreach for newsworthy campaigns
- "Still time to help" messaging

**Phase 4 — Final Push (Days 26-30)**
- Countdown: "X days left"
- "So close" posts showing remaining gap
- Final email blast with compelling CTA
- Direct asks to high-potential contacts who haven't given

### Event: 6 Phases over 4-6 Weeks

**Phase 1 — Announce (6 weeks out)**
- Public announcement across all channels
- Open early bird registration
- Email blast to existing list

**Phase 2 — Early Bird (4-5 weeks out)**
- Close early bird, open regular pricing
- Lineup/agenda reveal content
- Partner/sponsor cross-promotion begins

**Phase 3 — Social Proof (3 weeks out)**
- "X tickets sold" posts
- Testimonials from past attendees or registrants
- Speaker/performer spotlights

**Phase 4 — Last Chance (1-2 weeks out)**
- Urgency: "Only X spots left" or "X days remaining"
- Price tier deadline messaging if applicable
- Direct outreach to undecided prospects

**Phase 5 — Day-Of**
- Live coverage, stories, behind-the-scenes
- Attendee-generated content prompts (hashtag, photo spots)

**Phase 6 — Post-Event**
- Thank yous within 48 hours
- Photo gallery within 1 week
- Next event teaser

### Collection: 5 Phases over 2-3 Weeks

**Phase 1 — Launch (Day 0)**
- Send to all group channels: brief, friendly, link + deadline

**Phase 2 — Progress (Day 3)**
- "We're at X% — thanks to everyone who's paid"
- Lead with gratitude, include link for those who haven't

**Phase 3 — Midpoint (Day 7 or halfway)**
- "Over halfway there — X of Y people have paid"
- Social proof drives action

**Phase 4 — Urgency (3 days before deadline)**
- "Deadline is [date]. We still need X people to pay to [achieve goal]."
- Connect to a real consequence

**Phase 5 — Deadline (Day of)**
- "Last day!" — short, no guilt, just facts + link

*Max 5-6 total messages to full group. Private follow-ups only after deadline.*

## Content Rotation Angles

Rotate through these 8 angles to keep promotion fresh (all types have equivalents):

| Angle | Fundraiser | Event | Collection |
|-------|-----------|-------|-----------|
| Story / Announcement | Full situation explanation | What, when, where, why it matters | What this is for and how it works |
| Person / Lineup | Humanize the beneficiary | Speakers, performers, organizers | Group context, who's involved |
| Progress | Milestone celebrations | Tickets sold milestones | Payment progress ("12 of 20 paid!") |
| Gratitude | Thanking donors publicly | Thanking registrants and partners | Thanking those who've paid |
| Urgency | Deadline / remaining gap | Countdown / scarcity | Deadline / payment needed |
| Impact | How funds are being used | What attendees will experience | What the collected funds enable |
| Ask | Direct donation request | Direct ticket purchase prompt | Direct payment request |
| Share | Ask supporters to spread word | Ask registrants to bring friends | N/A (collections are private) |

## Platform-Specific Formatting

- **Facebook**: 2-3 paragraphs, emotional hook, photo, direct link + CTA at end
- **Instagram**: Caption under 125 words before fold, 5-10 relevant hashtags, Story version with link sticker
- **TikTok**: 60-90 second script, hook in first 3 seconds, authentic > polished
- **Twitter/X**: Under 280 chars or thread format, punchy, link in reply (fundraisers/events only)
- **LinkedIn**: 3-4 paragraphs, professional framing, career/community angle
- **Email**: Subject under 50 chars, personalized greeting, one CTA, P.S. line with share ask
- **Text/WhatsApp**: Under 160 chars + link, extremely personal, one clear ask

## Email Outreach Tiers

| Tier | Audience | Ask | Style |
|------|----------|-----|-------|
| 1 — Inner circle | Family, close friends | Specific dollar amount + share / buy a ticket / pay now | Deeply personal, first-person |
| 2 — Extended network | Colleagues, acquaintances | General support + share | Warm, broader appeal |
| 3 — Community | Local groups, organizations | Share first, act if moved | Community-framing, impact-focused |
| 4 — Cold outreach | Media, influencers, orgs | Coverage or signal boost | Professional pitch, newsworthy angle |

## Key Statistics

- Each new sharing method = **2.5x increase in visibility** (all types)
- 6+ sharing methods = **3x more donations** (fundraisers)
- **61% of millennials** discover events through social media (events)
- Events promoted 4-6 weeks out sell **70% more tickets** than 2-week promotions (events)
- Max **5-6 messages** to full group before diminishing returns (collections)

## Additional Resources

- **`references/post-templates.md`** — Ready-to-customize social post templates for all types and platforms
- **`references/email-sequences.md`** — Drip sequences for all types (launch, updates, final push, event countdown, collection reminders)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/campaign-promotion/SKILL.md
git commit -m "feat: rewrite campaign-promotion skill as unified engine for all types"
```

---

## Task 5: Rewrite campaign-analytics SKILL.md

**Files:**
- Modify: `plugin/skills/campaign-analytics/SKILL.md`

- [ ] **Step 1: Overwrite the file**

```markdown
---
name: campaign-analytics
description: >
  This skill should be used when the user asks to "check my campaign health",
  "how is my campaign doing", "analyze my performance", "why aren't I getting
  donations", "why aren't tickets selling", "optimize my campaign", "what should
  I do next", "campaign is stalled", or needs data-driven recommendations to
  improve results for fundraisers, events, or group collections on PayIt2.
  Also triggers on "campaign metrics", "conversion rate", "analytics",
  "performance score", "campaign diagnosis", "event analytics", or
  "campaign optimization".
version: 1.0.0
---

# Campaign Analytics

Diagnose campaign health, identify bottlenecks, and prescribe specific actions — for fundraisers, events, and group collections. This skill turns raw campaign data into actionable coaching.

## Health Score Formula

Calculate a 0-100 health score using type-specific weights:

### Fundraiser Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Momentum | 25% | Donation velocity vs. >2/day target in week 1 |
| Social reach | 20% | Shares, unique visitors, share-to-visit ratio |
| Story quality | 15% | Description length, photo present, video present, title strength |
| Donor engagement | 15% | Thank-you rate, update frequency, donor return rate |
| Goal progress | 15% | % of goal reached vs. days active |
| Network activation | 10% | Co-organizer count, email list usage, channel diversity |

### Event Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Registration velocity | 25% | % of capacity sold per week (healthy: 10-15%/week) |
| Capacity utilization | 20% | % of total capacity sold (target 80%+ by event date) |
| Promotion reach | 20% | Channels active, partner cross-promotion, share rate |
| Engagement | 15% | Registrant-to-sharer ratio (target: 1 in 5 registrants shares) |
| Revenue | 10% | Revenue vs. break-even vs. goal |
| Logistics readiness | 10% | Communication cadence, confirmation emails set up |

### Collection Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Payment rate | 30% | % of group that has paid (target: 80%+ by deadline) |
| Deadline proximity | 20% | Days remaining vs. payment rate (are you on pace?) |
| Communication cadence | 20% | Reminder timing following Friendly Collector framework |
| Response rate | 15% | % who respond to messages (even "I'll pay soon" counts) |
| Transparency | 15% | Cost breakdown visible, progress updates shared |

## Score Interpretation (All Types)

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Thriving | Maintain cadence, expand to new channels |
| 60-79 | Healthy | Address 1-2 weak areas, increase promotion |
| 40-59 | At risk | Significant changes needed — dispatch campaign-assistant agent |
| 20-39 | Critical | Major intervention — dispatch campaign-assistant agent |
| 0-19 | Stalled | Consider relaunch or pivot |

## Diagnostic Framework

When an organizer asks "why isn't this working?" run through all 3 stages:

### Stage 1: Traffic Diagnosis
**Question**: Are people seeing the campaign?

- Fundraiser: page views, shares, channel diversity
- Event: registration page visits, social reach, partner posts
- Collection: did launch message reach all group members?

**If traffic is low**: Problem is promotion, not the page. Reference campaign-promotion skill.

### Stage 2: Conversion Diagnosis
**Question**: Are visitors taking action?

- Fundraiser: visit-to-donation rate (healthy: 5-15%), avg donation $35-75
- Event: visit-to-registration rate (healthy: 15-25%), ticket tier distribution
- Collection: payment rate per reminder sent (should increase after each message)

**If traffic is fine but conversion is low**: Problem is the page. Reference campaign-creation skill.

### Stage 3: Engagement Diagnosis
**Question**: Are supporters becoming advocates?

- Fundraiser: donor-to-sharer ratio (target >15%), update frequency
- Event: registrant-to-sharer ratio (target: 1 in 5), re-share content posted
- Collection: did payers bring peer pressure? Are non-payers responding to reminders?

**If conversion is fine but growth has stalled**: Problem is engagement loop. Reference supporter-engagement skill.

## Type-Specific KPIs

### Fundraiser KPIs
| KPI | Formula | Target |
|-----|---------|--------|
| Donation velocity | Donations per day | >2/day in week 1 |
| Share rate | Shares / page views | >5% |
| Conversion rate | Donations / unique visitors | 5-15% |
| Average donation | Total raised / donor count | $35-$75 |
| Donor-to-sharer ratio | Sharers / donors | >15% |
| Update frequency | Updates / weeks active | >1/week |
| Time to first donation | Hours from launch to first gift | <4 hours |

### Event KPIs
| KPI | Healthy Range | Warning Sign |
|-----|--------------|--------------|
| Registration velocity | 10-15% of capacity/week | <5% after launch week |
| Capacity utilization | On track to 80%+ by event | <50% at midpoint |
| Early bird conversion | 25-35% of total tickets | <15% |
| Ticket tier distribution | Even spread across tiers | >80% in cheapest tier |
| Registrant share rate | 1 in 5 registrants shares | <1 in 10 |
| Email open rate | 40-60% | <25% |

### Collection KPIs
| KPI | Healthy | Warning |
|-----|---------|---------|
| Payment rate at midpoint | >50% paid | <30% paid |
| Payment rate at deadline | >80% paid | <60% paid |
| Response rate to messages | >70% (paid or acknowledged) | <40% |
| Days to full collection | 2-3 weeks from launch | >4 weeks with <80% paid |

## Optimization Playbook by Effort

### Quick Wins (do today — all types)
- Fundraiser: Add/improve primary photo, shorten description to <150 words, add co-organizer, thank unthanked donors, post one update
- Event: Post urgency content (seats remaining, days left), send reminder to opened-but-didn't-buy email segment, update hero image
- Collection: Send a progress update to the group, privately follow up with 1-2 non-payers

### Medium Effort (this week)
- Fundraiser: Record and upload video (4x more funds), send personalized emails to top 20 contacts, create content for 3+ social channels
- Event: Activate partner cross-promotion, create social proof content ("X registrants"), launch group discount offer
- Collection: Add a co-collector, extend deadline with real-constraint framing, restructure payment tier if response is concentrated in one option

### Strategic Moves (campaign is stalled)
- Fundraiser: Rewrite title (test 3 options), refresh full description, pitch local media
- Event: Consider price adjustment, add a new tier, reach out to complementary organizations for cross-promotion
- Collection: One-on-one outreach to every non-payer, consider scope reduction to match actual payment rate

## Additional Resources

- **`references/benchmark-data.md`** — Detailed benchmarks by category and campaign type
- **`references/optimization-checklist.md`** — Comprehensive optimization checklist unified across all types
```

- [ ] **Step 2: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/campaign-analytics/SKILL.md
git commit -m "feat: rewrite campaign-analytics skill with type-adaptive health scoring"
```

---

## Task 6: Rewrite supporter-engagement SKILL.md + create reminder-templates.md

**Files:**
- Modify: `plugin/skills/supporter-engagement/SKILL.md`
- Create: `plugin/skills/supporter-engagement/references/reminder-templates.md`

- [ ] **Step 1: Overwrite supporter-engagement SKILL.md**

```markdown
---
name: supporter-engagement
description: >
  This skill should be used when the user asks to "thank my donors", "thank my
  supporters", "write thank-you messages", "re-engage supporters", "post a
  campaign update", "show impact", "write updates", "follow up with donors",
  "follow up with attendees", "remind people to pay", or needs guidance on
  turning donors, attendees, or contributors into advocates on PayIt2. Also
  triggers on "donor retention", "supporter engagement", "gratitude messages",
  "impact reporting", "attendee follow-up", "collection reminders", or
  "supporter CRM".
version: 1.0.0
---

# Supporter Engagement

Build lasting supporter relationships across all campaign types. Engaged supporters share, re-engage, and recruit — this is a massive competitive advantage most organizers ignore.

## The Supporter Lifecycle (All Types)

```
FIRST ACTION → THANK YOU → UPDATE → RE-ENGAGE → ADVOCATE
(donation/registration/payment)  (<1 hr)  (regular)  (milestone)  (ongoing)
```

## Thank-You System

### Timing Rules
- **Within 1 hour**: Personalized thank-you (highest impact window)
- **Within 24 hours**: Public acknowledgment (social post or campaign update)
- **Within 1 week**: Impact update showing how their support is being put to work

### Personalization Tiers (Fundraisers)
| Tier | Range | Style | Length |
|------|-------|-------|--------|
| Micro | $1-$25 | Warm, "every dollar matters" | 2-3 sentences |
| Standard | $26-$100 | Personal, specific impact of their amount | 3-4 sentences |
| Major | $101-$500 | Deeply personal, name how their gift moves the needle | 4-5 sentences |
| Anchor | $500+ | Full personal letter, reference relationship if known | Full letter |

### Equivalents for Other Types
- **Event attendees**: Thank for registering. Treat ticket price as proxy for tier — match enthusiasm to price paid.
- **Group members who paid**: Thank for paying on time, frame as contributing to a shared goal. No tiers needed — a warm, brief message for everyone is appropriate.

### Thank-You Framework (All Types)
1. **Name them**: First name always. Never "Dear Supporter."
2. **Acknowledge the action**: "Your donation of $X..." / "Your registration for [Event]..." / "Your payment of $X..."
3. **Show impact**: Tie their specific action to a tangible outcome
4. **Humanize**: A brief update, emotional moment, or what happens next
5. **Extend**: For fundraisers — ask for a share (frame as optional). For events — ask them to bring a friend. For collections — celebrate that they're in.

### Public Gratitude Posts
- Name donors / registrants by first name (with permission) or anonymously ("A generous friend just donated $50!")
- Show the progress bar movement: "Thanks to 12 amazing people, we're now at 35%!"
- Keep it authentic — performative gratitude backfires

## Campaign Updates

### Update Cadence by Type

**Fundraiser milestones:**
| Milestone | Update type | Channel |
|-----------|------------|---------|
| 25% of goal | Progress + renewed ask | Campaign page + social |
| 50% of goal | Halfway + impact story | Campaign page + email |
| 75% of goal | "So close" + share request | All channels |
| Goal reached | Victory + deep gratitude | All channels + personal messages |
| Post-campaign | Impact report | Email + campaign page |

**Event milestones:**
| Milestone | Update type | Channel |
|-----------|------------|---------|
| 25% capacity | Social proof post | Social + email |
| Early bird closing | Urgency + last chance | All channels |
| 50% sold | Momentum post | Social + email |
| Last 20 tickets | Scarcity messaging | All channels |
| 1 week out | Attendee logistics | Email to registrants |
| Post-event | Thank you + highlights | Email + social |

**Collection milestones:**
| Milestone | Update type | Channel |
|-----------|------------|---------|
| 25% paid | Progress + encourage | Group channel |
| 50% paid | "Over halfway!" | Group channel |
| 75% paid | Urgency + gratitude | Group channel |
| Deadline approaching | Final nudge | Group channel + private to non-payers |
| Goal reached | Celebration + what happens next | Group channel |

### Update Content Framework (All Types)
1. **Progress metric**: Current status (amount raised, tickets sold, payments received, % of goal)
2. **Emotional beat**: A new detail, quote, behind-the-scenes moment
3. **Fund/resource usage**: How support has or will be allocated
4. **Forward look**: What happens next, what's still needed
5. **CTA**: Donate/buy/pay more, share, or celebrate

## Re-Engagement Strategies

### Re-engagement Triggers
- Fundraiser stalled for 3+ days with no new donations
- Event registration velocity dropped below 5%/week
- Collection past midpoint with <50% paid
- Milestone approaching (within 10% of 25/50/75/100%)
- New development (court date, event lineup reveal, booking update)

### Re-engagement Message Types
1. **Milestone nudge**: "We're just $200 away from 50% — can you help us get there?"
2. **Story update**: "Here's what's happened since you registered / donated..."
3. **Share request**: "Would you share with one friend? Here's a pre-written post."
4. **Urgency trigger**: "The court date is in 5 days / The event is in 2 weeks / Deadline is Friday"
5. **Gratitude loop**: "Because of you, [person/group] was able to [outcome]"

## The "Friendly Collector" Principles

These apply broadly — not just to collections. Frame every follow-up as a progress update, not a demand.

- **Lead with gratitude and progress**: "We're at 70%!" before "Please pay"
- **Never single out non-participants publicly**: Private follow-ups only after deadline
- **Celebrate milestones**: Public recognition drives the remaining group to act
- **Frame reminders as progress**, never accusations
- **Maximum 5-6 messages** to the full group (collections); 2-3 re-engagement posts (fundraisers/events)

## Supporter-to-Advocate Conversion

### Conversion Tactics (All Types)
1. **Post-action share prompt**: Immediately after donating/registering/paying, suggest pre-written share content
2. **Personalized share content**: Generate custom posts they can copy-paste
3. **Co-organizer invitation**: Top donors / enthusiastic attendees make great co-organizers (3x success rate)
4. **Challenges**: "If 5 friends register by Friday, we'll reveal the surprise guest"
5. **Thank-and-tag**: Public thank-yous that tag the supporter (with permission)

## Additional Resources

- **`references/thank-you-templates.md`** — Templates by tier and channel for all campaign types
- **`references/update-templates.md`** — Update templates for each milestone type across all types
- **`references/reminder-templates.md`** — Collection reminder cadence + re-engagement messages
```

- [ ] **Step 2: Create reminder-templates.md**

```markdown
# Reminder Templates

Collection reminder cadence and re-engagement messages for all campaign types.

---

## Group Collection Reminder Cadence

Maximum 5-6 messages to the full group. Follow this sequence.

### Message 1 — Launch (Day 0)

**Group text / Slack:**
> Hey everyone! Here's the link to pay for [purpose]: [LINK]. Total is $[amount] per person. Deadline is [date]. Thanks! 🙌

**Email subject:** [Group Name] [Purpose] — Payment Link Inside
> Hi everyone,
>
> Here's the link to pay your share for [purpose]: [LINK]
>
> **Your amount:** $[amount]
> **Deadline:** [date] (we need to [book/order] by then)
>
> Questions? Just reply to this email.
>
> Thanks,
> [Name]

---

### Message 2 — Progress Update (Day 3)

**Group text / Slack:**
> We're at [X]%! Thanks to everyone who's already paid 🎉 If you haven't yet, here's the link: [LINK]. Deadline: [date].

**Email subject:** [X] people down, [Y] to go!
> Hi everyone,
>
> Quick update: [X] of [Y] people have paid — we're [X]% of the way there!
>
> Thanks to everyone who's already taken care of it. If you haven't yet, here's the link: [LINK]
>
> Deadline: [date]
>
> [Name]

---

### Message 3 — Midpoint (Day 7 or halfway to deadline)

**Group text / Slack:**
> Over halfway there! [X] of [Y] people have paid. If you haven't yet, here's the link: [LINK]

**Email subject:** More than halfway — keep it going!
> Hey everyone,
>
> We've crossed the halfway mark! [X] of [Y] people have paid so far.
>
> If you haven't had a chance yet: [LINK]
>
> Deadline is [date] — [real constraint reason].
>
> [Name]

---

### Message 4 — Urgency (3 days before deadline)

**Group text / Slack:**
> Deadline is [date] — just [X] days away. We still need [Y] more people to pay so we can [book the venue / place the order / etc.]. Link: [LINK]

**Email subject:** [X] days left — we need your payment
> Hi everyone,
>
> Our deadline is coming up fast — [date] is [X] days away.
>
> We still need [Y] more people to pay before we can [book / order / confirm]. Here's the link: [LINK]
>
> If you have any questions, reply to this email.
>
> Thanks,
> [Name]

---

### Message 5 — Deadline Day

**Group text / Slack:**
> Last day! We still need [X] more payments to hit our goal. Please pay today if you haven't: [LINK]

**Email subject:** Today is the last day
> Hi everyone,
>
> Today is our deadline. We're [X]% of the way there and just need [Y] more payments.
>
> If you're planning to pay, please do it today: [LINK]
>
> Thank you,
> [Name]

---

### Message 6 — Post-Deadline Straggler (Private Only — never to full group)

**Personal text:**
> Hey [Name]! Just following up on the [purpose] payment. We're finalizing things and just need your $[amount]. Here's the link: [LINK]. Hope everything's OK — let me know if you have any questions!

**Personal email subject:** Quick follow-up on [purpose] payment
> Hi [Name],
>
> Just wanted to follow up personally on the [purpose] payment ($[amount]). We're wrapping up and just need a few more to finalize.
>
> Here's the link: [LINK]
>
> If there's an issue or you need more time, just let me know — happy to work something out.
>
> [Name]

---

## Fundraiser Re-Engagement Templates

### Milestone Nudge
**Social post:**
> We're $[X] away from [next milestone]! [Beneficiary] is counting on us. Can you help us close the gap? [LINK]

**Text to past donor:**
> Hey [Name], just wanted to let you know we're SO close to [milestone]. $[gap] away! Would you consider sharing the link with one friend? [LINK]

---

### Story Update Re-Engagement
**Email subject:** Update on [Beneficiary Name]'s situation
> Hi [Name],
>
> I wanted to give you an update since you've been so supportive.
>
> [2-3 sentences: What's happened since they donated. A new development, a moment of hope, a next step.]
>
> We're currently at [%] of our goal with [X] days remaining. If you know anyone who might want to help, here's the link to share: [LINK]
>
> Thank you again for everything.
> [Name]

---

## Event Re-Engagement Templates

### Opened-But-Didn't-Register Email
**Subject:** Still time to grab your ticket for [Event Name]
> Hi [Name],
>
> You checked out [Event Name] but didn't grab a ticket yet — just wanted to make sure you didn't miss out.
>
> [1-2 sentences about what makes the event special.]
>
> [Specific urgency: Early bird ends [date] / Only [X] spots left / Price goes up [date]]
>
> Grab your ticket here: [LINK]
>
> [Name]

### Last Chance to Bring a Friend (to registered attendees)
**Email subject:** Bring someone to [Event Name] — a few spots left
> Hi [Name],
>
> Excited to see you at [Event Name]!
>
> We still have [X] spots available if you want to bring someone. Just forward this link: [LINK]
>
> See you [date]!
> [Name]

---

## Collection Celebration Templates

### Goal Reached — Group Announcement
**Group text / Slack:**
> WE DID IT! 🎉 Everyone has paid and we've hit our goal. [What happens next: "Booking the cabin now!" / "Ordering jerseys this week!" / etc.] Thanks to everyone — this is going to be amazing!

**Email subject:** Goal reached — thank you all!
> Hi everyone,
>
> We've hit our goal! 🎉 All payments are in and we're moving forward with [booking/ordering/planning].
>
> [What happens next and timeline.]
>
> Thank you all — this wouldn't happen without everyone pulling together.
>
> [Name]
```

- [ ] **Step 3: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/skills/supporter-engagement/SKILL.md
git add plugin/skills/supporter-engagement/references/reminder-templates.md
git commit -m "feat: rewrite supporter-engagement skill + add reminder-templates for all types"
```

---

## Task 7: Create the 4 new commands

**Files:**
- Create: `plugin/commands/campaign.md`
- Create: `plugin/commands/promote.md`
- Create: `plugin/commands/check-in.md`
- Create: `plugin/commands/engage.md`

- [ ] **Step 1: Create campaign.md**

```markdown
---
description: Create and launch any campaign type on PayIt2 — fundraiser, event, or group collection
allowed-tools: Read, Write, WebSearch
argument-hint: [optional: type of campaign or brief description]
---

Create a PayIt2 campaign: $ARGUMENTS

Work through this launch workflow step by step:

1. **Identify Campaign Type**: If not clear from the arguments, ask: "What are you creating — a fundraiser, an event, or a group collection?" Use the campaign-context skill to establish type before proceeding.

2. **Conduct the Story/Details Interview**: Using the campaign-creation skill, ask the type-appropriate interview questions one at a time:
   - **Fundraiser**: Who needs help, what happened, what funds cover, timeline, stakes, existing support
   - **Event**: Type, date/time/location, capacity, what attendees experience, logistics
   - **Collection**: Purpose, group size, total amount, deadline, fixed/tiered/flexible model

3. **Generate 5 Title Options**: Score each on clarity, emotional impact, and SEO value (under 60 characters). Present all 5 and ask which direction they prefer.

4. **Write the Campaign Description**: Use the type-appropriate structure from the campaign-creation skill:
   - Fundraiser: Hook → Person → Situation → Plan → Ask (~150 words)
   - Event: Hook → What/When/Where → Who → Included → Schedule → Logistics (<200 words)
   - Collection: Purpose → Amount → Deadline → How to Pay (~75 words)
   Present the draft and ask for feedback.

5. **Visual Strategy**: Recommend specific photos and video based on campaign type. Offer to write a video script if applicable.

6. **Goal / Pricing Setup**:
   - Fundraiser: Recommend goal amount using psychology guidelines (under $5K = 2.5x more likely to succeed). Explain the reasoning.
   - Event: Design ticket tiers (2-4 tiers, 20-25% price gaps, early bird strategy). Present a tier table.
   - Collection: Calculate per-person amount (recommend fixed, tiered, or flexible based on their situation). Show the math.

7. **Pre-Publish Checklist**: Run through the type-specific checklist from the campaign-creation skill. Flag anything missing.

8. **Save the Launch Package**: Write a markdown file called `[campaign-title]-launch-package.md` in the workspace with: final title, description, goal/pricing setup, visual strategy notes, and pre-publish checklist results.
```

- [ ] **Step 2: Create promote.md**

```markdown
---
description: Build a multi-channel promotion strategy and content calendar for any campaign type
allowed-tools: Read, Write, WebSearch
argument-hint: [optional: campaign name, URL, or type]
---

Build a promotion strategy for this campaign: $ARGUMENTS

Follow this workflow:

1. **Gather Context**: Use the campaign-context skill to establish campaign type, title, URL (if live), how long it's been running, and what promotion has been tried so far.

2. **Assess Current State**: Ask:
   - "Which channels have you been using?"
   - "What's working and what isn't?"
   - "Any specific platforms or audiences you want to target?"

3. **Recommend Channel Strategy**: Using the campaign-promotion skill, prioritize channels based on type and what the organizer has told you:
   - Fundraisers: Lead with personal networks (Facebook, email, text)
   - Events: Lead with social discovery (Instagram, TikTok, community boards, partner cross-promotion)
   - Collections: Lead with direct messaging (group text, Slack/Teams, email)

   Present the prioritized channel list and explain why each is (or isn't) a priority for their specific situation.

4. **Build the Content Calendar**: Create a phased schedule appropriate to the campaign type:
   - Fundraiser: 4 phases over 30 days
   - Event: 6 phases over 4-6 weeks
   - Collection: 5 phases over 2-3 weeks

   Include specific posting dates/days, content angles for each post, and which channels to use.

5. **Generate Batch Content**: Dispatch the content-generator agent to produce:
   - 5-7 social media posts (platform-native, varied angles)
   - 2-3 email templates (appropriate to their tier/phase)
   - 2-3 text message templates (for inner circle or group)
   - SEO recommendations (keywords to use, community groups to post in, media outreach angles if relevant)

6. **Save the Promotion Package**: Write all content to `[campaign-title]-promotion-[date].md` in the workspace, organized by platform and phase.
```

- [ ] **Step 3: Create check-in.md**

```markdown
---
description: Run a weekly health check on any campaign — diagnose issues and get a prioritized action plan
allowed-tools: Read, Write, WebSearch
argument-hint: [optional: campaign name or current stats]
---

Run a campaign health check: $ARGUMENTS

Follow this diagnostic workflow:

1. **Gather Context**: Use the campaign-context skill to establish:
   - Campaign type, title, URL (if available)
   - Current numbers — ask by type:
     - **Fundraiser**: Amount raised, donor count, days active, goal, channels being used
     - **Event**: Tickets sold, total capacity, days until event, channels being used
     - **Collection**: Payments received, people paid vs. total group, days until deadline, channels used

2. **Calculate Health Score**: Using the campaign-analytics skill, score 0-100 with type-specific weights:
   - Fundraiser: momentum 25%, social reach 20%, story quality 15%, donor engagement 15%, goal progress 15%, network activation 10%
   - Event: registration velocity 25%, capacity utilization 20%, promotion reach 20%, engagement 15%, revenue 10%, logistics 10%
   - Collection: payment rate 30%, deadline proximity 20%, communication cadence 20%, response rate 15%, transparency 15%

   Present the score with a factor-by-factor breakdown. If score is below 60, dispatch the campaign-assistant agent for deep analysis.

3. **Diagnose the Bottleneck**: Run the 3-stage diagnostic:
   - Stage 1: Is it a traffic problem? (Are people seeing the campaign?)
   - Stage 2: Is it a conversion problem? (Are visitors taking action?)
   - Stage 3: Is it an engagement problem? (Are supporters becoming advocates?)
   Name the primary bottleneck clearly.

4. **This Week's Action Plan**: Prescribe 3-5 actions in priority order:
   - 🔴 Do today (highest impact, lowest effort)
   - 🟡 Do this week (medium effort, strong impact)
   - 🟢 Plan for next week (strategic, longer-term)

5. **Generate Fresh Content**: If the bottleneck is traffic or engagement, dispatch the content-generator agent to produce:
   - 3-5 social posts for the coming week
   - 1 campaign update to post on the page
   - 1 email or message template

6. **Save the Weekly Report**: Write the health check results to `[campaign-title]-checkin-[date].md` in the workspace.
```

- [ ] **Step 4: Create engage.md**

```markdown
---
description: Manage supporter relationships — thank-yous, updates, re-engagement, and advocacy asks
allowed-tools: Read, Write
argument-hint: [optional: what you want to do — thank donors, post update, re-engage, etc.]
---

Manage supporter engagement for your campaign: $ARGUMENTS

Follow this workflow:

1. **Identify the Action**: Use the campaign-context skill to establish campaign type, then ask what the organizer wants to do:
   - **Thank supporters** (donors / attendees / people who paid)
   - **Post a campaign update** (milestone, story update, impact report)
   - **Re-engage lapsed supporters** (bring back dormant donors, reach non-registrants, follow up with non-payers)
   - **Ask for shares** (turn supporters into advocates)

2. **Gather What's Needed for the Action**:
   - For thank-yous: How many people? Do you have names and amounts? What channel (email, text, social, in-campaign post)?
   - For updates: What milestone or news? What's the current progress?
   - For re-engagement: How long since last activity? What's the situation now?
   - For share asks: Who are you asking — donors, attendees, group members?

3. **Generate Personalized Messages**: Adapt by type and action:

   **Thank supporters:**
   - Fundraiser: Tier-appropriate messages (micro $1-25, standard $26-100, major $101-500, anchor $500+)
   - Event: Attendee confirmation + excitement builder
   - Collection: Payment acknowledgment + progress update

   **Post update:**
   - Fundraiser: Milestone structure (25%, 50%, 75%, goal) — use update content framework
   - Event: Lineup reveal, logistics update, "can't wait to see you" energy
   - Collection: Progress tally ("12 of 20 paid"), deadline context

   **Re-engage:**
   - Fundraiser: Story update for lapsed donors, gentle share request
   - Event: Last-chance message for non-registrants
   - Collection: Private 1:1 follow-up for non-payers (Friendly Collector principles — never public, never accusatory)

   **Ask for shares:**
   - All types: Pre-written share content they can copy-paste, co-organizer invitation, challenge format

   If generating for multiple people, dispatch the supporter-outreach agent for batch personalization.

4. **Multi-Channel Versions**: For each message, provide versions appropriate for the channel(s) the organizer is using (email, text/WhatsApp, DM, social post, in-campaign update).

5. **Save the Engagement Package**: Write all generated messages to `[campaign-title]-engagement-[date].md` in the workspace, organized by recipient or action type.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/commands/campaign.md plugin/commands/promote.md
git add plugin/commands/check-in.md plugin/commands/engage.md
git commit -m "feat: add 4 unified commands — campaign, promote, check-in, engage"
```

---

## Task 8: Rewrite campaign-assistant agent

**Files:**
- Modify: `plugin/agents/campaign-assistant.md`

- [ ] **Step 1: Overwrite the file**

```markdown
---
name: campaign-assistant
description: Use this agent for a deep campaign health analysis with strategic coaching recommendations. Deploy when the organizer needs an honest assessment of what's working, what's not, and exactly what to do next — especially when the campaign is underperforming. Works for fundraisers, events, and group collections.
---

<example>
Context: Fundraiser has been live for 2 weeks and is only at 15% of goal
user: "My fundraiser isn't doing well, what should I change?"
assistant: "Let me run a full campaign diagnosis using the campaign-assistant agent to identify exactly what's holding you back."
<commentary>
Underperforming campaigns need systematic diagnosis across traffic, conversion, and engagement — a multi-step analysis task best handled by the coaching agent.
</commentary>
</example>

<example>
Context: Event is 3 weeks away and ticket sales have stalled at 40% capacity
user: "My event ticket sales have slowed down — what should I do?"
assistant: "I'll use the campaign-assistant agent to analyze your registration velocity and design a recovery strategy."
<commentary>
Event stalls require understanding velocity, remaining runway, and a sequenced urgency plan — the coaching agent handles this well.
</commentary>
</example>

<example>
Context: Group collection is 5 days before deadline with only 55% paid
user: "I'm 5 days out and still need 10 more people to pay — help!"
assistant: "Let me use the campaign-assistant agent to assess where you stand and give you a day-by-day plan for the final push."
<commentary>
Deadline-pressure collection situations need a specific sequenced plan, not generic advice.
</commentary>
</example>

model: opus
color: cyan
tools: ["Read", "Write", "Glob", "Grep", "WebSearch"]

You are an expert campaign strategist and coach. Give organizers honest, data-driven assessments and specific, actionable recommendations. Works across fundraisers, events, and group collections.

**Your Core Responsibilities:**
1. Assess campaign health across all dimensions for the specific campaign type
2. Identify the primary bottleneck holding the campaign back
3. Prescribe specific, prioritized actions — not generic advice
4. Coach on mindset and expectations (some campaigns need strategy adjustment, not more promotion)
5. Build confidence by highlighting what IS working

**Coaching Process:**
1. **Gather data**: Ask for or read current campaign metrics appropriate to type:
   - Fundraiser: amount raised, donors, shares, days active, goal, channels used, updates posted
   - Event: tickets sold, capacity, days until event, channels used, tier distribution, registration velocity
   - Collection: payments received, group size, days until deadline, channels used, reminder cadence

2. **Calculate health score**: Use type-specific weights from the campaign-analytics skill. Score 0-100 and break down each factor.

3. **Run the 3-stage diagnostic**: Traffic → Conversion → Engagement. Identify which stage has the biggest drop-off.

4. **Benchmark**: Compare performance against type-specific benchmarks. Is this campaign above or below peers?

5. **Prescribe**: Give exactly 5 prioritized actions. For each: what to do, why it matters, and expected impact.

6. **Forecast**: Based on current trajectory, project where the campaign will land. Be honest. If projection is below goal, offer strategic alternatives:
   - Fundraiser: lower goal, extend timeline, relaunch with new strategy
   - Event: price adjustment, new tier, expanded promotional channels
   - Collection: follow up individually with non-payers, extend deadline, reduce scope

**Coaching Principles:**
- Be honest but encouraging. Never sugarcoat, but always pair criticism with a path forward.
- Be specific. "Post more on social media" is bad advice. "Post a 60-second TikTok showing what happens at 3pm on event day" is good advice.
- Prioritize ruthlessly. Give them the ONE thing with the biggest impact first.
- Use data to motivate. "Campaigns that add video raise 4x more" is more motivating than "you should add a video."
- Respect the organizer's emotional state. Fundraisers especially are running during difficult times. Be warm, professional, and empathetic.

**Output Format:**
Present the analysis as a structured coaching report:
1. Campaign Snapshot (key metrics at a glance, campaign type)
2. Health Score (0-100 with factor breakdown using type-specific weights)
3. Primary Diagnosis (one-sentence root cause)
4. What's Working (2-3 positives to build on)
5. Top 5 Actions (prioritized, specific, with expected impact)
6. 7-Day Game Plan (day-by-day actions adapted to campaign type)
7. Honest Forecast (projected outcome on current trajectory vs. with recommended changes)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/agents/campaign-assistant.md
git commit -m "feat: rewrite campaign-assistant agent for all campaign types"
```

---

## Task 9: Rewrite content-generator + create supporter-outreach agent

**Files:**
- Modify: `plugin/agents/content-generator.md`
- Create: `plugin/agents/supporter-outreach.md`

- [ ] **Step 1: Overwrite content-generator.md**

```markdown
---
name: content-generator
description: Use this agent to autonomously generate a batch of campaign content — social media posts, emails, text messages, content calendars, or SEO recommendations. Deploy when a command needs multiple pieces of content generated across platforms in one pass. Works for fundraisers, events, and group collections.
---

<example>
Context: Organizer needs a full week of promotion content for their fundraiser
user: "Generate all my social media posts for this week"
assistant: "I'll use the content-generator agent to create platform-specific posts for the full week."
<commentary>
Batch content generation across multiple platforms is a multi-step task ideal for this agent.
</commentary>
</example>

<example>
Context: Event is 3 weeks away and organizer needs a social proof push
user: "Create social proof content for my event — 40 people have registered"
assistant: "I'll use the content-generator agent to produce social proof posts, countdown content, and a share-request email."
<commentary>
Coordinated content across multiple formats and angles for an event — ideal batch generation task.
</commentary>
</example>

<example>
Context: Collection is at midpoint and organizer needs fresh progress messaging
user: "Generate my midpoint collection messages — 12 of 20 people have paid"
assistant: "I'll use the content-generator agent to create a progress update for the group plus private follow-up templates."
<commentary>
Collection content needs group-appropriate tone (never accusatory) and both group and private versions.
</commentary>
</example>

model: sonnet
color: magenta
tools: ["Read", "Write", "Glob", "Grep", "WebSearch"]

You are a campaign content specialist. Generate high-converting content across all digital channels for fundraisers, events, and group collections.

**Your Core Capabilities:**
1. Generate social media posts for Facebook, Instagram, TikTok, Twitter/X, LinkedIn, and Nextdoor
2. Write email campaigns for different audience segments (inner circle, extended network, community, cold outreach)
3. Create campaign updates that drive re-engagement
4. Build content calendars with posting schedules
5. Adapt a single story or announcement across multiple content angles and formats
6. Generate SEO recommendations (keywords, community posting targets, media outreach angles)

**Content Generation Process:**
1. Gather campaign context: type, title, story/details, current progress, phase of campaign
2. Identify the content need: type, quantity, platforms, campaign phase
3. Generate platform-native content tailored to each platform's format and audience
4. Apply content rotation: cycle through the 8 angles (Story, Person/Lineup, Progress, Gratitude, Urgency, Impact, Ask, Share — with type equivalents)
5. Include CTAs: every piece has a clear call to action (donate, register, pay, share)
6. Organize output clearly in a markdown file with sections per platform

**Platform Formatting Rules:**
- **Facebook**: 2-3 paragraphs, emotional hook first, photo reference, direct link + CTA at end
- **Instagram**: Caption under 125 words before fold, 5-10 hashtags, Story version with link sticker callout
- **TikTok**: 60-90 second video script, hook in first 3 seconds, text overlay callouts noted
- **Twitter/X**: Under 280 chars or thread format, punchy, link in first tweet
- **LinkedIn**: Professional framing, 3-4 paragraphs, career/community/justice angle
- **Email**: Subject under 50 chars, personalized greeting, one CTA, P.S. line with share/share ask
- **Text/WhatsApp**: Under 160 chars + link, extremely personal, one clear ask

**Tone by Campaign Type:**
- **Fundraiser**: Authentic, urgent but not desperate, grateful but not performative, specific (names, amounts, dates)
- **Event**: Energetic, FOMO-inducing, excitement-forward, countdown-aware, social proof-heavy
- **Collection**: Friendly, progress-framed, never accusatory, brief and casual, always includes the payment link and deadline

**SEO and Amplification (included in all content packages):**
- Recommend 3-5 keywords to naturally use in the page description and social posts
- Identify 2-4 relevant community groups or subreddits to post in (if applicable)
- Suggest 1-2 local media angles if the campaign has a newsworthy hook (fundraisers and events)
- List relevant hashtags by platform

**Output Format:**
Organize content in a markdown file:
```
## [Platform Name]
### Post 1 — [Angle/Phase]
[Content]
---
### Post 2 — [Angle/Phase]
[Content]
```
Include copy-paste-ready content with placeholder notes for photos or videos (e.g., `[PHOTO: beneficiary at hospital]`).
```

- [ ] **Step 2: Create supporter-outreach.md**

```markdown
---
name: supporter-outreach
description: Use this agent to generate personalized supporter communications at scale — thank-you messages, re-engagement outreach, share requests, impact updates, and collection follow-ups. Deploy when the /engage command has multiple people to communicate with or needs a complex multi-stage sequence. Works for donors, event attendees, and group collection members.
---

<example>
Context: Organizer received 18 donations over the weekend and needs to thank everyone
user: "I got a bunch of donations this weekend, help me thank everyone"
assistant: "I'll use the supporter-outreach agent to generate personalized thank-you messages for each donor."
<commentary>
Batch personalized communication with different tones per tier requires systematic generation — ideal for this agent.
</commentary>
</example>

<example>
Context: Event sold out and organizer wants to send attendee welcome sequences
user: "Generate welcome messages for all my event registrants"
assistant: "I'll use the supporter-outreach agent to create the full attendee communication sequence."
<commentary>
Multi-touchpoint attendee journeys (confirmation → logistics → day-of → post-event) are perfect for this agent.
</commentary>
</example>

<example>
Context: Collection is past deadline with 6 non-payers
user: "I have 6 people who still haven't paid — help me follow up"
assistant: "I'll use the supporter-outreach agent to generate private, friendly follow-up messages for each non-payer."
<commentary>
Individual non-payer follow-ups must be personal, non-accusatory, and private — this agent handles the tonal nuance.
</commentary>
</example>

model: sonnet
color: green
tools: ["Read", "Write", "Glob", "Grep"]

You are a supporter relationship specialist. Generate personalized, authentic communications that make people feel valued and deepen their connection to the campaign — for donors, event attendees, and group collection members.

**Your Core Capabilities:**
1. Generate personalized thank-you messages calibrated to tier and campaign type
2. Create re-engagement messages for lapsed supporters or non-payers
3. Write share requests that feel genuine, not transactional
4. Draft impact updates showing supporters how their contribution is being used
5. Build communication sequences (thank → update → share request → impact report; attendee journey; collection reminder cadence)

**Communication Process:**
1. Gather supporter data: names, amounts/tiers, relationships, campaign type, what action they took
2. Segment: Fundraiser donors by tier (Micro/Standard/Major/Anchor); event attendees by ticket tier; collection members by paid/pending status
3. Generate messages: personalized per person or tier, following tone guidelines below
4. Multi-channel output: for each message, provide email, text, DM, and social post versions as appropriate
5. Organize output: clear markdown file with one section per person or segment

**Personalization Rules:**
- Always use the person's first name
- Reference their specific action (donation amount, ticket tier, payment amount)
- Tie their contribution to a tangible outcome
- If relationship is known, reference it
- Never make thank-yous feel transactional or like a setup for another ask

**Tone by Message Type:**
- **Fundraiser thank-you**: Warm, genuine, slightly emotional. The donor should feel their gift mattered.
- **Event thank-you**: Excited, welcoming, forward-looking. Build anticipation.
- **Collection thank-you**: Friendly, appreciative, brief. "You're the best, it's taken care of."
- **Re-engagement (fundraiser)**: Friendly update, not guilt-trip. Show progress, gently ask for a share.
- **Non-payer follow-up (collection)**: Warm and curious ("everything OK?"), not accusatory. Private only.
- **Share request**: "Help us reach more people" framing. Provide pre-written content they can copy-paste.
- **Impact update**: Specific, transparent, hopeful. Show exactly what their support enabled.

**Attendee Communication Sequences:**
When generating event attendee communications, produce the full journey:
1. Registration confirmation (immediate): Confirm details, set expectations, calendar invite prompt
2. 1 week before: Logistics reminder, agenda, what to bring, anticipation builder
3. 3 days before: Excitement builder, share with friends prompt, social media handles/hashtag
4. Day before: Final logistics, everything in one place, "see you tomorrow!" energy
5. Day of: Welcome message, real-time instructions, social prompts
6. 24-48 hours after: Thank you, feedback survey, highlight reel/photos, next event tease

**Output Format:**
```
## [Person Name / Segment Name]
### [Channel] — [Message Type]
[Message content]

---
```
```

- [ ] **Step 3: Commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/agents/content-generator.md plugin/agents/supporter-outreach.md
git commit -m "feat: rewrite content-generator agent + add supporter-outreach agent"
```

---

## Task 10: Delete obsolete files

**Files to delete:**
- `plugin/skills/event-management/` (entire folder)
- `plugin/skills/group-collection/` (entire folder)
- `plugin/commands/launch-fundraiser.md`
- `plugin/commands/plan-event.md`
- `plugin/commands/collect-from-group.md`
- `plugin/commands/boost-campaign.md`
- `plugin/commands/thank-donors.md`
- `plugin/commands/weekly-checkin.md`
- `plugin/agents/donor-outreach.md`
- `plugin/agents/event-promoter.md`
- `plugin/agents/group-collector.md`
- `plugin/agents/seo-optimizer.md`

- [ ] **Step 1: Delete all obsolete files**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
rm -rf plugin/skills/event-management
rm -rf plugin/skills/group-collection
rm plugin/commands/launch-fundraiser.md
rm plugin/commands/plan-event.md
rm plugin/commands/collect-from-group.md
rm plugin/commands/boost-campaign.md
rm plugin/commands/thank-donors.md
rm plugin/commands/weekly-checkin.md
rm plugin/agents/donor-outreach.md
rm plugin/agents/event-promoter.md
rm plugin/agents/group-collector.md
rm plugin/agents/seo-optimizer.md
```

- [ ] **Step 2: Verify structure is clean**

```bash
find plugin -type f | sort
```
Expected output — only v1.0.0 files:
```
plugin/.claude-plugin/plugin.json
plugin/agents/campaign-assistant.md
plugin/agents/content-generator.md
plugin/agents/supporter-outreach.md
plugin/commands/campaign.md
plugin/commands/check-in.md
plugin/commands/engage.md
plugin/commands/promote.md
plugin/skills/campaign-analytics/SKILL.md
plugin/skills/campaign-analytics/references/benchmark-data.md
plugin/skills/campaign-analytics/references/optimization-checklist.md
plugin/skills/campaign-context/SKILL.md
plugin/skills/campaign-creation/SKILL.md
plugin/skills/campaign-creation/references/cost-splitting-guide.md
plugin/skills/campaign-creation/references/story-templates.md
plugin/skills/campaign-creation/references/ticket-strategy.md
plugin/skills/campaign-creation/references/title-formulas.md
plugin/skills/campaign-promotion/SKILL.md
plugin/skills/campaign-promotion/references/email-sequences.md
plugin/skills/campaign-promotion/references/post-templates.md
plugin/skills/supporter-engagement/SKILL.md
plugin/skills/supporter-engagement/references/reminder-templates.md
plugin/skills/supporter-engagement/references/thank-you-templates.md
plugin/skills/supporter-engagement/references/update-templates.md
```

- [ ] **Step 3: Commit deletions**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add -A
git commit -m "chore: remove v0.2.0 components replaced by v1.0.0 unified architecture"
```

---

## Task 11: Update plugin.json + rebuild zip + final commit

**Files:**
- Modify: `plugin/.claude-plugin/plugin.json`

- [ ] **Step 1: Update plugin.json**

Replace the entire file contents with:

```json
{
  "name": "payit2-campaign-assistant",
  "version": "1.0.0",
  "description": "AI-powered campaign assistant for PayIt2.com — create, promote, and optimize any campaign type: fundraisers, events, and group collections. Get coaching, generate content, and engage supporters through conversation with Claude.",
  "author": {
    "name": "Brian Anderson, PayIt2 Founder"
  },
  "keywords": ["fundraising", "events", "group-payments", "crowdfunding", "payit2", "campaigns", "supporter-engagement", "content-generation", "campaign-analytics", "event-ticketing", "cost-splitting"]
}
```

- [ ] **Step 2: Rebuild the zip**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
./build-plugin.sh
```
Expected: `payit2-campaign-assistant.zip` created/updated in repo root.

- [ ] **Step 3: Verify the zip contains the right files**

```bash
unzip -l payit2-campaign-assistant.zip | grep -v "__MACOSX" | sort
```
Expected: all v1.0.0 files listed, no v0.2.0 files (no event-management, group-collection, launch-fundraiser, plan-event, collect-from-group, boost-campaign, thank-donors, weekly-checkin, donor-outreach, event-promoter, group-collector, seo-optimizer).

- [ ] **Step 4: Final commit**

```bash
cd /Users/briananderson/Source/PayIt2/payit2-campaign-assistant
git add plugin/.claude-plugin/plugin.json payit2-campaign-assistant.zip
git commit -m "release: Campaign Assistant v1.0.0 — unified architecture for fundraisers, events, and collections"
git push
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ campaign-context skill — Task 1
- ✅ campaign-creation rewrite — Task 2
- ✅ ticket-strategy.md + cost-splitting-guide.md added to campaign-creation — Task 3
- ✅ campaign-promotion rewrite — Task 4
- ✅ campaign-analytics rewrite — Task 5
- ✅ supporter-engagement rewrite + reminder-templates.md — Task 6
- ✅ 4 new commands — Task 7
- ✅ campaign-assistant agent rewrite — Task 8
- ✅ content-generator rewrite + supporter-outreach new — Task 9
- ✅ Delete obsolete files — Task 10
- ✅ plugin.json v1.0.0 + rebuild zip — Task 11

**Reference docs not explicitly rewritten in this plan** (story-templates.md, title-formulas.md, post-templates.md, email-sequences.md, benchmark-data.md, optimization-checklist.md, thank-you-templates.md, update-templates.md): These files exist from v0.2.0 and contain valid content. The SKILL.md rewrites reference them correctly. They should be reviewed and updated for event/collection coverage, but this is non-blocking for the v1.0.0 launch — the skill files carry the primary type-adaptive logic. Schedule a follow-up to expand them.

**No placeholders found** — all file contents are complete.

**Type consistency** — "campaign type" terminology is consistent throughout (fundraiser / event / collection).
