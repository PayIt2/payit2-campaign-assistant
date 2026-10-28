export interface InitInfo { plugins: string[]; mcpServers: { name: string; status: string }[]; tools: string[]; version: string }
export interface ToolUse { id: string; name: string; input: Record<string, unknown> }
export interface ToolResult { toolUseId: string; text: string; isError: boolean }
export interface HookEvent { event: string; name: string; outcome: string; output: string }
export interface StreamSummary {
  init: InitInfo | null;
  toolUses: ToolUse[];
  toolResults: ToolResult[];
  hooks: HookEvent[];
  denials: string[];
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

export function parseStream(jsonl: string): StreamSummary {
  const s: StreamSummary = { init: null, toolUses: [], toolResults: [], hooks: [], denials: [], resultText: "", isError: false, costUsd: 0 };
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
      }
    } else if (e.type === "user") {
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
