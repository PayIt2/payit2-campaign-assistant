---
name: promote
description: Build a multi-channel promotion strategy and content calendar for any campaign type
allowed-tools: Read, Write, WebSearch
argument-hint: "[optional: campaign name, URL, or type]"
---

Build a promotion strategy for this campaign: $ARGUMENTS

Under-promotion is the #1 reason campaigns fail. This skill turns promotion into a systematic process for fundraisers, events, and groups.

This skill works in two modes. See `campaign-context` for the operating-modes overview.

- **Standalone (default):** generate a full promotion package (channel strategy, content calendar, platform-specific posts, email templates) that the organizer can copy and paste into their channels. No PayIt2 account needed.
- **Connected:** the same package, with live progress numbers (`get_payment_summary`, `get_campaign_health`) woven into update posts. Update posts are saved as drafts with `save_update_post`: each draft waits on the campaign's page in the organizer's PayIt2 account, and nothing is posted or emailed until they post it there.

If PayIt2 tools aren't available in the session, use the standalone flow. See `campaign-context` for the one sign-in mention.

## Core Principle: The 2.5x Rule

Each new sharing method used leads to a **2.5x increase in campaign visibility**. Organizers who share through 6+ methods receive **3x more engagement**. Maximize channel diversity and posting frequency.

## Workflow

### 1. Gather Context

Use the campaign-context skill to establish campaign type, title, URL (if live), how long it has been running, and what promotion has been tried so far.

### 2. Assess Current State

Ask the organizer:
- "Which channels have you been using?"
- "What's working and what isn't?"
- "Any specific platforms or audiences you want to target?"

### 3. Recommend Channel Strategy

Prioritize channels based on type and what the organizer has told you.

#### Fundraiser: Lead with Personal Networks
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

#### Event: Lead with Social Discovery
| Channel | Priority | Why |
|---------|----------|-----|
| Instagram | High | Visual, shareable, event discovery |
| Facebook Events | High | Native event feature, community reach |
| TikTok | High | Countdown content, FOMO, viral potential |
| Email | High | Confirmed buyers share more after registration |
| Community boards | Medium | Nextdoor, local Facebook Groups |
| LinkedIn | Medium | Professional/industry events |
| Partner cross-promotion | High | Other organizations with same audience |

#### Group: Lead with Direct Messaging
| Channel | Priority | Why |
|---------|----------|-----|
| Group text / WhatsApp group | High | Where the group already communicates |
| Email | High | Formal, easy to reply and ask questions |
| Slack / Teams | High | Work or club groups |
| Facebook Group | Medium | If the group has one |
| Social media | Low | Group campaigns are private; public posts have low ROI |

Present the prioritized channel list and explain why each is (or is not) a priority for their specific situation.

### 4. Build the Content Calendar

Create a phased schedule appropriate to the campaign type.

#### Fundraiser: 4 Phases over 30 Days

**Phase 1 - Launch Blitz (Days 1-3)**
- Day 1 AM: Announcement on all primary channels
- Day 1 PM: Personal text/WhatsApp to inner circle (10-20 people)
- Day 1 Evening: Email blast to full contact list
- Day 2: Video content - personal appeal or behind-the-scenes
- Day 3: First thank-you post (gratitude to early donors)

**Phase 2 - Momentum (Days 4-14)**
- 3x/week social posts with rotating content angles
- Weekly email update to supporters
- Milestone celebrations (25%, 50% progress)
- Re-share requests to existing donors

**Phase 3 - Sustain and Expand (Days 15-25)**
- Fresh storytelling angles (impact stories, new photos)
- Community cross-posting (local groups, relevant forums)
- Press outreach for newsworthy campaigns
- "Still time to help" messaging

**Phase 4 - Final Push (Days 26-30)**
- Countdown: "X days left"
- "So close" posts showing remaining gap
- Final email blast with compelling CTA
- Direct asks to high-potential contacts who have not given

#### Event: 6 Phases over 4-6 Weeks

**Phase 1 - Announce (6 weeks out)**
- Public announcement across all channels
- Open early bird registration
- Email blast to existing list

**Phase 2 - Early Bird (4-5 weeks out)**
- Close early bird, open regular pricing
- Lineup/agenda reveal content
- Partner/sponsor cross-promotion begins

**Phase 3 - Social Proof (3 weeks out)**
- "X tickets sold" posts
- Testimonials from past attendees
- Speaker/performer spotlights

**Phase 4 - Last Chance (1-2 weeks out)**
- Urgency: "Only X spots left" or "X days remaining"
- Price tier deadline messaging if applicable
- Direct outreach to undecided prospects

**Phase 5 - Day-Of**
- Live coverage, stories, behind-the-scenes
- Attendee-generated content prompts (hashtag, photo spots)

**Phase 6 - Post-Event**
- Thank yous within 48 hours
- Photo gallery within 1 week
- Next event teaser

#### Group: 5 Phases over 2-3 Weeks

**Phase 1 - Launch (Day 0)**
- Send to all group channels: brief, friendly, link + deadline

**Phase 2 - Progress (Day 3)**
- "We're at X% - thanks to everyone who's paid"
- Lead with gratitude, include link for those who have not

**Phase 3 - Midpoint (Day 7 or halfway)**
- "Over halfway there - X of Y people have paid"
- Social proof drives action

**Phase 4 - Urgency (3 days before deadline)**
- "Deadline is [date]. We still need X people to pay to [achieve goal]."
- Connect to a real consequence

**Phase 5 - Deadline (Day of)**
- "Last day!" - short, no guilt, just facts + link

*Max 5-6 total messages to the group. Private follow-ups with unpaid members only after deadline.*

### 5. Content Rotation Angles

Rotate through these 8 angles to keep promotion fresh (all types have equivalents):

| Angle | Fundraiser | Event | Group |
|-------|-----------|-------|-----------|
| Story / Announcement | Full situation explanation | What, when, where, why it matters | What this is for and how it works |
| Person / Lineup | Humanize the beneficiary | Speakers, performers, organizers | Group context, who's involved |
| Progress | Milestone celebrations | Tickets sold milestones | Payment progress ("12 of 20 paid!") |
| Gratitude | Thanking donors publicly | Thanking attendees and partners | Thanking members who've paid |
| Urgency | Deadline / remaining gap | Countdown / scarcity | Deadline / payment needed |
| Impact | How funds are being used | What attendees will experience | What the collected funds enable |
| Ask | Direct donation request | Direct ticket purchase prompt | Direct payment request |
| Share | Ask supporters to spread word | Ask attendees to bring friends | N/A (group campaigns are private) |

### 6. Platform-Specific Formatting

- **Facebook**: 2-3 paragraphs, emotional hook, photo, direct link + CTA at end
- **Instagram**: Caption under 125 words before fold, 5-10 relevant hashtags, Story version with link sticker
- **TikTok**: 60-90 second script, hook in first 3 seconds, authentic > polished
- **Twitter/X**: Under 280 chars or thread format, punchy, link in first tweet
- **LinkedIn**: 3-4 paragraphs, professional framing, career/community angle
- **Email**: Subject under 50 chars, personalized greeting, one CTA, P.S. line with share ask
- **Text/WhatsApp**: Under 160 chars + link, extremely personal, one clear ask

### 7. Email Outreach Tiers

| Tier | Audience | Ask | Style |
|------|----------|-----|-------|
| 1 - Inner circle | Family, close friends | Specific dollar amount + share / buy a ticket / pay now | Deeply personal, first-person |
| 2 - Extended network | Colleagues, acquaintances | General support + share | Warm, broader appeal |
| 3 - Community | Local groups, organizations | Share first, act if moved | Community-framing, impact-focused |
| 4 - Cold outreach | Media, influencers, orgs | Coverage or signal boost | Professional pitch, newsworthy angle |

### 8. SEO and Amplification

For campaigns that benefit from discovery (fundraisers and events, not groups):
- Use 3-5 searchable keywords naturally in the page description and social posts
- Cross-post to relevant community groups (Nextdoor, Reddit, Facebook Groups, local forums)
- For newsworthy campaigns: write a press release, pitch local TV/newspaper, reach out to relevant bloggers/podcasters
- Use event directories if applicable (Eventbrite, local community calendars, Meetup)

### 9. Generate Batch Content

Produce in-session:
- 5-7 social media posts (platform-native, varied angles)
- 2-3 email templates (appropriate to their tier/phase)
- 2-3 text message templates (for inner circle or group)
- SEO recommendations (keywords to use, community groups to post in, media outreach angles if relevant)

### 10. Save the Promotion Package

Write all content to `[campaign-title]-promotion-[date].md` in the workspace, organized by platform and phase.

## Key Statistics

- Each new sharing method = **2.5x increase in visibility** (all types)
- 6+ sharing methods = **3x more donations** (fundraisers)
- **61% of millennials** discover events through social media (events)
- Events promoted 4-6 weeks out sell **70% more tickets** than 2-week promotions (events)
- Max **5-6 messages** to full group before diminishing returns (group campaigns)

## Reference Files

- **`references/post-templates.md`** - Ready-to-customize social post templates for all types and platforms
- **`references/email-sequences.md`** - Drip sequences for all types (launch, updates, final push, event countdown, group reminders)

## If the PayIt2 MCP server is connected

When the MCP server is available, the promotion workflow gains two additional capabilities:

1. **Live progress data for update posts**: Call `get_payment_summary(campaignId)` and `get_campaign_health(campaignId)` to retrieve current totals, donor count, daily run rate, and pace. Use the real numbers in update content instead of placeholders, e.g. "We just crossed 50%, thank you to all 47 donors who got us here" instead of "We're X% to goal."

2. **Save update drafts with `save_update_post`**: After generating an update post, call `save_update_post(campaignId, content, title)` with a short headline as the title. The draft waits on the campaign's page in the organizer's PayIt2 account; nothing is posted or emailed until they review it and post it there. Tell them where to find it, and include the text in your reply.

**Enhanced workflow when MCP is connected:**
- After building the content calendar (step 4), pull live campaign numbers via `get_payment_summary` / `get_campaign_health` and weave them into the milestone update posts.
- Save each finished update as a draft with `save_update_post`, and tell the organizer it is waiting on their campaign's page.
- The standalone workflow (steps 1-10 above) is the default and works fully without MCP; the items above are additive enhancements.
