---
title: "Campaign Assistant tests"
type: reference
doc_status: active
owner: claude-maintained
---
# Campaign Assistant tests

Three suites, all against dev. Nothing here writes to production.

| Command | What it runs | Needs |
|---|---|---|
| `npm test` | Offline checks of the plugin files and the test helpers | Nothing |
| `npm run connector` | Layer 1: the plugin's tools exist on dev, read tools match dev's API, a draft campaign round trip, the sign-in challenge, and the production URL (unauthenticated) | The test account's dev key |
| `npm run live` | Layer 2: headless Claude runs the plugin against dev in five scenarios | The dev key and a Claude token |

## Keys

The dev key belongs to a dev account used only by these tests (spec D11). The tests read
`E2E_FIXTURE_API_KEY`, or on a Mac the Keychain item `payit2-e2e-fixture-api-key`:

    security add-generic-password -U -a "$USER" -s payit2-e2e-fixture-api-key -w

CI reads the `E2E_FIXTURE_API_KEY` Actions secret.

The live run uses a throwaway home folder so your own plugins and MCP servers stay out of it,
which also hides your Claude login. Give it a token instead: run `claude setup-token`, then

    security add-generic-password -U -a "$USER" -s payit2-e2e-claude-token -w

(or set `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`).

## Test data

Every write carries a run marker such as `[e2e 20261027T1530]`. Campaigns created by a run are
hard-deleted at the end, and each run first removes leftovers from crashed runs. The fixture
campaign `Campaign Assistant e2e fixture` is a standing draft that the tests reuse.
