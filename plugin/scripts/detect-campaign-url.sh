#!/bin/bash
# UserPromptSubmit hook: detect PayIt2 campaign URLs and inject context for Claude.
# Input: JSON via stdin with "prompt" field.
# Output: context injected into Claude's pre-processing for this turn.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')

if echo "$PROMPT" | grep -qiE 'payit2\.com/(fundraiser|event|group)/[a-zA-Z0-9_-]+'; then
  URL=$(echo "$PROMPT" | grep -oiE 'payit2\.com/(fundraiser|event|group)/[a-zA-Z0-9_-]+' | head -1)
  TYPE=$(echo "$URL" | cut -d'/' -f2)
  SLUG=$(echo "$URL" | cut -d'/' -f3)

  echo "[PayIt2 Campaign Detected: https://$URL]"
  echo "Type: $TYPE"
  echo ""
  echo "Call get_campaign('$SLUG') to fetch live stats before responding."
  echo ""
  echo "If the organizer hasn't said what they want, ask which command to run:"
  echo "  /check-in  — health score + prioritized action plan"
  echo "  /promote   — promotion strategy and content calendar"
  echo "  /engage    — participant messages (thank-yous, updates, re-engagement)"
fi
