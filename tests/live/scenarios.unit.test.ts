import { describe, it, expect } from "vitest";
import { parseStream } from "./stream.js";
import { checkNotSignedIn } from "./scenarios.js";

const BUNDLED = "plugin:payit2-campaign-assistant:payit2";

// Line shapes copied from live runs (CLI 2.1.252): the init status of the bundled server is "pending" in
// both the signed-out and the failed case, so the failure only shows up in the ToolSearch result.
function run(opts: { failedError?: string; reply: string }) {
  const toolResult = opts.failedError
    ? {
        type: "user",
        message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: `No matching deferred tools found. Note: these configured MCP servers failed to connect, so their tools are unavailable for this session: ${BUNDLED}: "${opts.failedError}".` }] },
        tool_use_result: { matches: [], query: "list_my_campaigns", total_deferred_tools: 14, failed_mcp_servers: [{ name: BUNDLED, error: opts.failedError }] },
      }
    : {
        type: "user",
        message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "No matching deferred tools found" }] },
        tool_use_result: { matches: [], query: "list_my_campaigns", total_deferred_tools: 14 },
      };
  return parseStream([
    { type: "system", subtype: "init", claude_code_version: "2.1.252", plugins: [{ name: "payit2-campaign-assistant" }], mcp_servers: [{ name: BUNDLED, status: "pending" }], tools: ["ToolSearch"] },
    { type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "ToolSearch", input: { query: "list_my_campaigns" } }] } },
    toolResult,
    { type: "assistant", message: { content: [{ type: "text", text: opts.reply }] } },
    { type: "result", subtype: "success", result: opts.reply, is_error: false, total_cost_usd: 0.05, permission_denials: [] },
  ].map((l) => JSON.stringify(l)).join("\n"));
}

const SIGNED_OUT_REPLY =
  "You're not signed in to PayIt2 yet, so I can't pull your live numbers automatically. In Claude Code, run `/mcp`, choose payit2, and sign in (on claude.ai, connect PayIt2 under Settings, Connectors).\n\n" +
  "In the meantime, I can still help. Just tell me the current stats for the Spring Legal Defense Fund:\n- Amount raised and goal\n- Number of supporters\n- Days active so far";

describe("checkNotSignedIn (scenario 4)", () => {
  it("passes when the connector is signed out and Claude asks for the numbers once", () => {
    // Real wording from dev-pointed runs: an imperative request with no '?' still counts as asking.
    expect(SIGNED_OUT_REPLY).not.toContain("?");
    expect(checkNotSignedIn(run({ reply: SIGNED_OUT_REPLY }))).toEqual([]);
  });

  it("fails and names the cause when the connector failed to connect (prod answered 403 to client registration)", () => {
    const err = "Dynamic Client Registration rejected (HTTP 403): html head title 403 Forbidden /title /head body center h1 403 Forbidden /h1 /center /body /html";
    const failures = checkNotSignedIn(run({ failedError: err, reply: SIGNED_OUT_REPLY }));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/failed to connect instead of showing signed out: Dynamic Client Registration rejected \(HTTP 403\)/);
  });

  it("fails a reply that stops at the sign-in message", () => {
    const reply = "The PayIt2 connector isn't authorized in this session. You'll need to sign in via `/mcp` to authorize PayIt2 access, then ask me again.";
    expect(checkNotSignedIn(run({ reply }))).toEqual(["after the sign-in mention, the reply does not ask the organizer for their numbers"]);
  });

  it("fails a reply that mentions sign-in twice", () => {
    const reply = SIGNED_OUT_REPLY + "\n\nAnd remember, you can sign in at any time to skip this.";
    expect(checkNotSignedIn(run({ reply }))[0]).toMatch(/exactly one paragraph, found 2/);
  });
});
