---
title: "Connecting PayIt2 in Claude"
type: reference
doc_status: active
owner: claude-maintained
---
# Connecting PayIt2 in this chat

Use this wording when a skill needs the organizer to connect PayIt2. Keep it to a few lines.

**In the Claude desktop app or claude.ai:**

> 1. Open **Customize > Plugins**, choose **PayIt2**, and open its **Connectors** tab.
> 2. Click **Connect** next to PayIt2.
> 3. On the PayIt2 sign-in page, choose **Continue with Google** or **Email me a sign-in link**. If you are new to PayIt2, either one creates your free account in the same step.
>
> Then tell me "connected".

**In Claude Code:** run `/mcp`, choose the PayIt2 server, and sign in on the PayIt2 page that opens in the browser, with **Continue with Google** or **Email me a sign-in link**. Then tell me "connected".

If the organizer says "connected" but the PayIt2 tools still are not available, ask them to start a new chat and run the command again. Do not loop on this.
