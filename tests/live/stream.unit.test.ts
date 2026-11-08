import { describe, it, expect } from "vitest";
import { parseStream, replyText } from "./stream.js";

const lines = [
  { type: "system", subtype: "hook_response", hook_event: "SessionStart", hook_name: "SessionStart:startup", outcome: "success", output: "" },
  {
    type: "system", subtype: "init", claude_code_version: "2.1.252",
    plugins: [{ name: "payit2", path: "/x", source: "payit2@inline", version: "1.7.0" }],
    mcp_servers: [{ name: "payit2", status: "connected" }],
    tools: ["Read", "mcp__payit2__get_campaign_health"],
  },
  { type: "assistant", message: { content: [
    { type: "text", text: "Checking." },
    { type: "tool_use", id: "t1", name: "mcp__payit2__get_campaign_health", input: { campaignId: "c1" } },
  ] } },
  { type: "user", message: { content: [
    { type: "tool_result", tool_use_id: "t1", content: [{ type: "text", text: "**Raised:** $0 of $5,000 goal (0.0%)" }] },
  ] } },
  { type: "system", subtype: "hook_response", hook_event: "PreToolUse", hook_name: "PreToolUse:mcp__payit2__update_campaign_settings", outcome: "success", output: "{}" },
  { type: "result", subtype: "success", result: "Your goal is $5,000.", is_error: false, total_cost_usd: 0.12,
    permission_denials: [{ tool_name: "mcp__payit2__update_campaign_settings", tool_use_id: "t2", tool_input: {} }] },
].map((l) => JSON.stringify(l)).join("\n");

describe("parseStream", () => {
  it("collects init, tool calls, results, hooks, denials and the final reply", () => {
    const s = parseStream(lines + "\nnot json\n");
    expect(s.init).toEqual({
      plugins: ["payit2"],
      mcpServers: [{ name: "payit2", status: "connected" }],
      tools: ["Read", "mcp__payit2__get_campaign_health"],
      version: "2.1.252",
    });
    expect(s.toolUses).toEqual([{ id: "t1", name: "mcp__payit2__get_campaign_health", input: { campaignId: "c1" } }]);
    expect(s.toolResults).toEqual([{ toolUseId: "t1", text: "**Raised:** $0 of $5,000 goal (0.0%)", isError: false }]);
    expect(s.hooks.map((h) => h.event)).toEqual(["SessionStart", "PreToolUse"]);
    expect(s.denials).toEqual(["mcp__payit2__update_campaign_settings"]);
    expect(s.resultText).toBe("Your goal is $5,000.");
    expect(s.assistantText).toEqual(["Checking."]);
    expect(s.costUsd).toBe(0.12);
  });

  it("keeps a reply that came before a closing tool call (the result is only the last message)", () => {
    // Shape of the first live check-in run: the full reply, then save_improvement_notes, then a one-line close.
    const closing = [
      { type: "assistant", message: { content: [{ type: "thinking", thinking: "Planning." }] } },
      { type: "assistant", message: { content: [{ type: "text", text: "## Weekly Check-In\n\n| Raised | $0 of $5,000 goal |" }] } },
      { type: "assistant", message: { content: [{ type: "tool_use", id: "t5", name: "mcp__payit2__save_improvement_notes", input: { campaignId: "c1", content: "notes" } }] } },
      { type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t5", content: [{ type: "text", text: "Saved improvement_suggestions content for campaign c1." }] }] } },
      { type: "assistant", message: { content: [{ type: "text", text: "Notes saved. That is the full check-in." }] } },
      { type: "result", subtype: "success", result: "Notes saved. That is the full check-in.", is_error: false, total_cost_usd: 0.14, permission_denials: [] },
    ].map((l) => JSON.stringify(l)).join("\n");
    const s = parseStream(closing);
    expect(s.resultText).not.toContain("$5,000");
    expect(s.assistantText).toEqual(["## Weekly Check-In\n\n| Raised | $0 of $5,000 goal |", "Notes saved. That is the full check-in."]);
    expect(replyText(s)).toContain("$0 of $5,000 goal");
    expect(replyText(s)).toContain("Notes saved.");
  });

  it("flags failed results and failed tool calls", () => {
    const failing = [
      { type: "assistant", message: { content: [
        { type: "tool_use", id: "t9", name: "mcp__payit2__update_campaign_settings", input: {} },
      ] } },
      { type: "user", message: { content: [
        { type: "tool_result", tool_use_id: "t9", is_error: true, content: "Campaign not found" },
      ] } },
      { type: "result", subtype: "error_during_execution", result: "The campaign could not be found.", is_error: true, total_cost_usd: 0.03, permission_denials: [] },
    ].map((l) => JSON.stringify(l)).join("\n");
    const s = parseStream(failing);
    expect(s.isError).toBe(true);
    expect(s.toolResults).toEqual([{ toolUseId: "t9", text: "Campaign not found", isError: true }]);
    expect(s.resultText).toBe("The campaign could not be found.");
  });
});
