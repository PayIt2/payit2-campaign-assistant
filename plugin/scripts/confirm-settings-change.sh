#!/bin/bash
# PreToolUse hook for update_campaign_settings. Since 2.1.0 the PayIt2 server saves nothing unless
# the call carries "confirm": true; without it the server returns a preview of each field's current
# and new value. So this hook asks only on the saving call: Claude Code and Cowork show their
# permission prompt there, and the organizer is asked once per change, not twice. In a headless -p
# run nobody can answer, so the call is denied and Claude reads the reason.
#
# One exception: a call that sets only the theme preset (campaignId plus themeId, with or without
# confirm) passes. The /campaign skill applies the theme right after creating a campaign, and the
# organizer already said yes to it in the creation summary.
#
# Input with no tool_input at all is asked about, never let through. Inside a JSON string value a
# quote is always escaped (\"), so an unescaped "confirm": true can only be the call's own key.
input=$(cat | tr -d '\n')
ask() {
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Changing campaign settings needs the organizer'"'"'s approval. Show each field'"'"'s current and new value before they approve."}}'
  exit 0
}
printf '%s' "$input" | grep -q '"tool_input"' || ask
args=$(printf '%s' "$input" | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^{}]*}' | head -n 1)
if [ -n "$args" ]; then
  fields=$(printf '%s' "$args" | sed -E 's/^"tool_input"[[:space:]]*:[[:space:]]*\{//; s/\}$//')
  rest=$(printf '%s' "$fields" \
    | sed -E 's/"campaignId"[[:space:]]*:[[:space:]]*"[^"]*"//; s/"themeId"[[:space:]]*:[[:space:]]*"[a-z0-9-]+"//; s/"confirm"[[:space:]]*:[[:space:]]*(true|false)//' \
    | tr -d ' ,\t')
  if [ -z "$rest" ] && printf '%s' "$fields" | grep -q '"themeId"' && printf '%s' "$fields" | grep -q '"campaignId"'; then
    exit 0
  fi
fi
printf '%s' "$input" | grep -qE '(^|[^\\])"confirm"[[:space:]]*:[[:space:]]*true' && ask
exit 0
