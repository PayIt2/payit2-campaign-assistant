#!/bin/bash
# SessionStart hook. Plain stdout from a SessionStart command hook becomes context for Claude.
# Prompt-type hooks are not supported on SessionStart, so this replaces the old prompt hook.
cat > /dev/null
cat <<'EOF'
PayIt2 Campaign Assistant is installed. If PayIt2 tools such as list_my_campaigns are available in this session, the organizer is signed in to PayIt2. In that case, call list_my_campaigns once to find their active campaigns, and call get_campaign_health for any campaign past half its timeline or below 30% of its goal or capacity. Open your first reply with a short greeting of three to five lines that names any urgent campaign and its top recommendation. If they have no campaigns, greet them and suggest /campaign. If PayIt2 tools are not available, do not greet and do not mention PayIt2 sign-in at the start of the session.
EOF
