---
description: Create and launch any campaign type on PayIt2 — fundraiser, event, or group
allowed-tools: Read, Write, WebSearch
argument-hint: [optional: type of campaign or brief description]
---

Create a PayIt2 campaign: $ARGUMENTS

Work through this launch workflow step by step:

1. **Identify Campaign Type**: If not clear from the arguments, ask: "What are you creating — a fundraiser, an event, or a group?" Use the campaign-context skill to establish type before proceeding.

2. **Conduct the Story/Details Interview**: Using the campaign-creation skill, ask the type-appropriate interview questions one at a time:
   - **Fundraiser**: Who needs help, what happened, what funds cover, timeline, stakes, existing support
   - **Event**: Type, date/time/location, capacity, what attendees experience, logistics
   - **Group**: Purpose, group size, total amount, deadline, fixed/tiered/flexible model

3. **Generate 5 Title Options**: Score each on clarity, emotional impact, and SEO value (under 60 characters). Present all 5 and ask which direction they prefer.

4. **Write the Campaign Description**: Use the type-appropriate structure from the campaign-creation skill:
   - Fundraiser: Hook → Person → Situation → Plan → Ask (~150 words)
   - Event: Hook → What/When/Where → Who → Included → Schedule → Logistics (<200 words)
   - Group: Purpose → Amount → Deadline → How to Pay (~75 words)
   Present the draft and ask for feedback.

5. **Visual Strategy**: Recommend specific photos and video based on campaign type. Offer to write a video script if applicable.

6. **Goal / Pricing Setup**:
   - Fundraiser: Recommend goal amount using psychology guidelines (under $5K = 2.5x more likely to succeed). Explain the reasoning.
   - Event: Design ticket types (2-4 types, 20-25% price gaps, early bird strategy). Present a pricing table.
   - Group: Calculate per-person amount (recommend fixed, tiered, or flexible based on their situation). Show the math.

7. **Pre-Publish Checklist**: Run through the type-specific checklist from the campaign-creation skill. Flag anything missing.

8. **Save the Launch Package**: Write a markdown file called `[campaign-title]-launch-package.md` in the workspace with: final title, description, goal/pricing setup, visual strategy notes, and pre-publish checklist results.
