#!/bin/bash
# PreToolUse hook for update_campaign_settings. Always asks the organizer to approve the change:
# Claude Code shows its permission prompt with the new values. In a headless -p run nobody can
# answer, so the call is denied and Claude reads the reason.
cat > /dev/null
printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Changing campaign settings needs the organizer'"'"'s approval. Show each field'"'"'s current and new value before they approve."}}'
