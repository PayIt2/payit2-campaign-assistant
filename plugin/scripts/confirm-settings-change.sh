#!/bin/bash
# PreToolUse hook for update_campaign_settings. Asks the organizer to approve the change:
# Claude Code shows its permission prompt with the new values. In a headless -p run nobody can
# answer, so the call is denied and Claude reads the reason.
#
# One exception: a call that sets only the theme preset (campaignId plus themeId) passes without
# the extra prompt. The /campaign skill applies the theme right after creating a campaign, and the
# organizer already said yes to it in the creation summary. Every other change still asks.
input=$(cat)
args=$(printf '%s' "$input" | tr -d '\n' | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^{}]*}' | head -n 1)
if [ -n "$args" ]; then
  rest=$(printf '%s' "$args" \
    | sed -E 's/^"tool_input"[[:space:]]*:[[:space:]]*\{//; s/\}$//' \
    | sed -E 's/"campaignId"[[:space:]]*:[[:space:]]*"[^"]*"//; s/"themeId"[[:space:]]*:[[:space:]]*"[a-z0-9-]+"//' \
    | tr -d ' ,\t')
  if [ -z "$rest" ] && printf '%s' "$args" | grep -q '"themeId"' && printf '%s' "$args" | grep -q '"campaignId"'; then
    exit 0
  fi
fi
printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Changing campaign settings needs the organizer'"'"'s approval. Show each field'"'"'s current and new value before they approve."}}'
