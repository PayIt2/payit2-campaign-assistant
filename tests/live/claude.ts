import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunOptions {
  name: string;
  prompt: string;
  pluginDir: string;
  outDir: string;
  mcpConfig?: object;
  maxTurns: number;
  maxBudgetUsd: number;
  model: string;
  auth: { CLAUDE_CODE_OAUTH_TOKEN?: string; ANTHROPIC_API_KEY?: string };
  timeoutMs?: number;
}

// Runs `claude -p` with a throwaway HOME and working folder, so only the plugin under test
// (and, when given, the dev connector) loads. The MCP config holds the dev key, so it lives
// in the throwaway folder with mode 0600 and is deleted afterwards.
export async function runClaude(o: RunOptions): Promise<{ jsonl: string; stderr: string; exitCode: number }> {
  mkdirSync(o.outDir, { recursive: true });
  const scratch = mkdtempSync(join(tmpdir(), "payit2-e2e-"));
  const home = join(scratch, "home");
  const cwd = join(scratch, "cwd");
  mkdirSync(home);
  mkdirSync(cwd);
  const args = [
    "-p", o.prompt,
    "--plugin-dir", o.pluginDir,
    "--output-format", "stream-json", "--verbose", "--include-hook-events",
    "--permission-mode", "dontAsk",
    "--model", o.model,
    "--max-turns", String(o.maxTurns),
    "--max-budget-usd", String(o.maxBudgetUsd),
  ];
  if (o.mcpConfig) {
    const path = join(scratch, "mcp.json");
    writeFileSync(path, JSON.stringify(o.mcpConfig), { mode: 0o600 });
    args.push("--mcp-config", path, "--strict-mcp-config", "--allowedTools", "mcp__payit2");
  }
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "",
    HOME: home,
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    LANG: "en_US.UTF-8",
    ...o.auth,
  };
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn("claude", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
      let jsonl = "";
      let stderr = "";
      let timedOut = false;
      const limitMs = o.timeoutMs ?? 10 * 60_000;
      // A hung run gets SIGTERM at the limit, then SIGKILL 5 seconds later if it has not exited.
      let killTimer: NodeJS.Timeout | undefined;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        killTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
      }, limitMs);
      child.stdout.on("data", (d) => { jsonl += d; });
      child.stderr.on("data", (d) => { stderr += d; });
      child.on("error", (err) => {
        clearTimeout(timer);
        clearTimeout(killTimer);
        reject(err);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        clearTimeout(killTimer);
        if (timedOut) stderr += `\n[runClaude] timed out after ${limitMs / 1000}s`;
        writeFileSync(join(o.outDir, `${o.name}.jsonl`), jsonl);
        resolve({ jsonl, stderr, exitCode: code ?? -1 });
      });
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
