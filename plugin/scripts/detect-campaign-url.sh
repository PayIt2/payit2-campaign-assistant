#!/bin/bash
# UserPromptSubmit hook: spot a PayIt2 campaign link in the organizer's message and add its type
# and slug to the turn. Plain shell only, with no external JSON parser, so it runs on any Mac or Linux machine.
# Input: the hook's JSON on stdin. Output: context for Claude, or nothing.
INPUT=$(cat)
URL=$(printf '%s' "$INPUT" | grep -oiE 'payit2\.com/(fundraiser|event|group)/[A-Za-z0-9_-]+' | head -n 1)
[ -z "$URL" ] && exit 0
TYPE=$(printf '%s' "$URL" | cut -d'/' -f2)
SLUG=$(printf '%s' "$URL" | cut -d'/' -f3)

cat <<EOF
[PayIt2 Campaign Detected: https://$URL]
Type: $TYPE
Slug: $SLUG

If PayIt2 tools are available, call get_campaign_overview with the slug or campaign ID to fetch live stats before responding. If they are not, ask the organizer for the current numbers; the skills work fine in standalone mode.

If the organizer hasn't said what they want, ask which command to run:
  /check-in  - health score and prioritized action plan
  /promote   - promotion strategy and content calendar
  /engage    - participant messages (thank-yous, updates, re-engagement)
EOF
