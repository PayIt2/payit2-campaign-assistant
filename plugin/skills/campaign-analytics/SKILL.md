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

Diagnose campaign health, identify bottlenecks, and prescribe specific actions — for fundraisers, events, and groups. This skill turns raw campaign data into actionable coaching.

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
| Engagement | 15% | Attendee-to-sharer ratio (target: 1 in 5 attendees shares) |
| Revenue | 10% | Revenue vs. break-even vs. goal |
| Logistics readiness | 10% | Communication cadence, confirmation emails set up |

### Group Weights
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
| 40-59 | At risk | Significant changes needed — dispatch campaign-coach agent |
| 20-39 | Critical | Major intervention — dispatch campaign-coach agent |
| 0-19 | Stalled | Consider relaunch or pivot |

## Diagnostic Framework

When an organizer asks "why isn't this working?" run through all 3 stages:

### Stage 1: Traffic Diagnosis
**Question**: Are people seeing the campaign?

- Fundraiser: page views, shares, channel diversity
- Event: registration page visits, social reach, partner posts
- Group: did launch message reach all members?

**If traffic is low**: Problem is promotion, not the page. Reference campaign-promotion skill.

### Stage 2: Conversion Diagnosis
**Question**: Are visitors taking action?

- Fundraiser: visit-to-donation rate (healthy: 5-15%), avg donation $35-75
- Event: visit-to-registration rate (healthy: 15-25%), ticket tier distribution
- Group: payment rate per reminder sent (should increase after each message)

**If traffic is fine but conversion is low**: Problem is the page. Reference campaign-creation skill.

### Stage 3: Engagement Diagnosis
**Question**: Are supporters becoming advocates?

- Fundraiser: donor-to-sharer ratio (target >15%), update frequency
- Event: attendee-to-sharer ratio (target: 1 in 5), re-share content posted
- Group: did paying members bring peer pressure? Are unpaid members responding to reminders?

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
| Attendee share rate | 1 in 5 attendees shares | <1 in 10 |
| Email open rate | 40-60% | <25% |

### Group KPIs
| KPI | Healthy | Warning |
|-----|---------|---------|
| Payment rate at midpoint | >50% paid | <30% paid |
| Payment rate at deadline | >80% paid | <60% paid |
| Response rate to messages | >70% (paid or acknowledged) | <40% |
| Days to full collection | 2-3 weeks from launch | >4 weeks with <80% paid |

## Optimization Playbook by Effort

### Quick Wins (do today — all types)
- **Fundraiser**: Add/improve primary photo, shorten description to <150 words, add co-organizer, thank unthanked donors, post one update
- **Event**: Post urgency content (seats remaining, days left), send reminder to opened-but-didn't-register email segment, update hero image
- **Group**: Send a progress update to the group, privately follow up with 1-2 unpaid members

### Medium Effort (this week)
- **Fundraiser**: Record and upload video (4x more funds), send personalized emails to top 20 contacts, create content for 3+ social channels
- **Event**: Activate partner cross-promotion, create social proof content ("X attendees registered"), launch group discount offer
- **Collection**: Add a co-collector, extend deadline with real-constraint framing, restructure payment tier if response is concentrated in one option

### Strategic Moves (campaign is stalled)
- **Fundraiser**: Rewrite title (test 3 options), refresh full description, pitch local media
- **Event**: Consider price adjustment, add a new tier, reach out to complementary organizations for cross-promotion
- **Group**: One-on-one outreach to every unpaid member, consider scope reduction to match actual payment rate

## Additional Resources

- **`references/benchmark-data.md`** — Detailed benchmarks by category and campaign type
- **`references/optimization-checklist.md`** — Comprehensive optimization checklist unified across all types
