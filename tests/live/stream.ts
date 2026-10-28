export interface InitInfo { plugins: string[]; mcpServers: { name: string; status: string }[]; tools: string[]; version: string }
export interface ToolUse { id: string; name: string; input: Record<string, unknown> }
export interface ToolResult { toolUseId: string; text: string; isError: boolean }
export interface FailedMcpServer { name: string; error: string }
export interface HookEvent { event: string; name: string; outcome: string; output: string }
export interface StreamSummary {
  init: InitInfo | null;
  toolUses: ToolUse[];
  toolResults: ToolResult[];
  hooks: HookEvent[];
  denials: string[];
  // Every text block Claude wrote, in order. `resultText` is only the last message, so a reply that
  // came before a closing tool call (for example a save) is in here and not in `resultText`.
  assistantText: string[];
  // MCP servers Claude Code reported as failed to connect (not merely signed out). The CLI attaches
  // this to a ToolSearch result as `tool_use_result.failed_mcp_servers`.
  failedMcpServers: FailedMcpServer[];
  resultText: string;
  isError: boolean;
  costUsd: number;
}

type Block = { type: string; [k: string]: unknown };

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as Block[]).filter((b) => b.type === "text").map((b) => String(b.text ?? "")).join("\n");
}

// Everything the organizer would have seen Claude say during the run, not only its final message.
export function replyText(s: StreamSummary): string {
  return s.assistantText.join("\n\n");
}

export function parseStream(jsonl: string): StreamSummary {
  const s: StreamSummary = { init: null, toolUses: [], toolResults: [], hooks: [], denials: [], assistantText: [], failedMcpServers: [], resultText: "", isError: false, costUsd: 0 };
  for (const line of jsonl.split("\n")) {
    let e: Record<string, any>;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type === "system" && e.subtype === "init") {
      s.init = {
        plugins: (e.plugins ?? []).map((p: { name: string }) => p.name),
        mcpServers: (e.mcp_servers ?? []).map((m: { name: string; status: string }) => ({ name: m.name, status: m.status })),
        tools: e.tools ?? [],
        version: e.claude_code_version ?? "",
      };
    } else if (e.type === "system" && e.subtype === "hook_response") {
      s.hooks.push({ event: e.hook_event ?? "", name: e.hook_name ?? "", outcome: e.outcome ?? "", output: e.output ?? "" });
    } else if (e.type === "assistant") {
      for (const b of (e.message?.content ?? []) as Block[]) {
        if (b.type === "tool_use") s.toolUses.push({ id: String(b.id), name: String(b.name), input: (b.input ?? {}) as Record<string, unknown> });
        else if (b.type === "text" && String(b.text ?? "").trim()) s.assistantText.push(String(b.text));
      }
    } else if (e.type === "user") {
      for (const m of (e.tool_use_result?.failed_mcp_servers ?? []) as { name?: string; error?: string }[]) {
        s.failedMcpServers.push({ name: String(m.name ?? ""), error: String(m.error ?? "") });
      }
      for (const b of (e.message?.content ?? []) as Block[]) {
        if (b.type === "tool_result") s.toolResults.push({ toolUseId: String(b.tool_use_id), text: blockText(b.content), isError: Boolean(b.is_error) });
      }
    } else if (e.type === "result") {
      s.resultText = String(e.result ?? "");
      s.isError = Boolean(e.is_error);
      s.costUsd = Number(e.total_cost_usd ?? 0);
      s.denials = (e.permission_denials ?? []).map((d: { tool_name: string }) => d.tool_name);
    }
  }
  return s;
}
