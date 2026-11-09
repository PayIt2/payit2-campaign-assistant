import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Backticked snake_case words in the plugin that are option or question types, not tools.
export const NON_TOOL_TOKENS = new Set(["multi_select", "pick_any", "pick_one"]);

const BACKTICKED = /`([a-z]+(?:_[a-z]+)+)(?:\([^`]*\))?`/g;
const MCP_NAME = /mcp__[A-Za-z0-9_.*-]*?__([a-z]+(?:_[a-z]+)+)/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function collectReferences(pluginDir: string): Map<string, string[]> {
  const refs = new Map<string, string[]>();
  for (const file of walk(pluginDir).filter((f) => /\.(md|json|sh)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    const rel = relative(pluginDir, file);
    const add = (name: string) => {
      if (NON_TOOL_TOKENS.has(name)) return;
      const files = refs.get(name) ?? [];
      if (!files.includes(rel)) files.push(rel);
      refs.set(name, files);
    };
    for (const m of text.matchAll(BACKTICKED)) add(m[1]);
    for (const m of text.matchAll(MCP_NAME)) add(m[1]);
  }
  return refs;
}
