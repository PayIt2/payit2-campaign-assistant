import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { E2EConfig } from "./env.js";

export interface Mcp {
  client: Client;
  callText(name: string, args: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}

export async function connectMcp(cfg: Pick<E2EConfig, "mcpUrl" | "apiKey">): Promise<Mcp> {
  const client = new Client({ name: "payit2-campaign-assistant-e2e", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(cfg.mcpUrl), {
    requestInit: { headers: { "x-api-key": cfg.apiKey } },
  });
  await client.connect(transport);
  return {
    client,
    async callText(name, args) {
      const res = await client.callTool({ name, arguments: args });
      const parts = (res.content ?? []) as Array<{ type: string; text?: string }>;
      const text = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n");
      if (res.isError) throw new Error(`${name} returned an error: ${text}`);
      return text;
    },
    close: () => client.close(),
  };
}
