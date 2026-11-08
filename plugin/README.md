# PayIt2

PayIt2 helps organizers run fundraisers, events and group payments. This plugin brings PayIt2
into Claude: it builds a campaign page from a few details, checks how a campaign is doing and
what to do next, writes promotion posts and emails, and drafts thank-yous and updates for
participants. It works on its own, and it does much more once you connect your PayIt2 account.

## Install

In claude.ai or the Claude desktop app, add **PayIt2** from Customize > Plugins. In Claude Code:

```
/plugin install payit2 --marketplace PayIt2/payit2-plugins-marketplace
```

## Connect your PayIt2 account

Open Customize > Plugins, choose PayIt2, and connect PayIt2 on its Connectors tab. Sign in with
Google or with an emailed sign-in link; either one creates a free PayIt2 account if you do not
have one yet.

## What it sends and where

- **PayIt2:** once you connect, the plugin uses PayIt2's server at `https://mcp.payit2.com/mcp`
  to read and change your own campaigns, as you. It never asks for a password or any other secret.
- **Unsplash:** when it picks a cover photo, it searches Unsplash's free photos and sends the
  chosen photo's address to PayIt2.
- **On your computer (Cowork and Claude Code only):** three small scripts add context to the
  conversation and ask before campaign settings change. They send nothing anywhere.

Privacy: https://www.payit2.com/privacy
Terms: https://www.payit2.com/terms
