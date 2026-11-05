import { execFileSync } from "node:child_process";

export const KEYCHAIN_SERVICE = "payit2-e2e-fixture-api-key";
export const CLAUDE_TOKEN_SERVICE = "payit2-e2e-claude-token";

export interface E2EConfig {
  apiKey: string;
  mcpUrl: string;
  apiUrl: string;
}

const DEV_HOST = /^(dev\.([a-z0-9-]+\.)*payit2\.com|localhost|127\.0\.0\.1)$/;

export function assertDevTarget(url: string): void {
  const host = new URL(url).hostname;
  if (!DEV_HOST.test(host)) {
    throw new Error(`Refusing to use ${host}: e2e tests write to dev hosts or localhost only.`);
  }
}

export function readKeychain(service: string): string | undefined {
  if (process.platform !== "darwin") return undefined;
  try {
    const value = execFileSync("security", ["find-generic-password", "-s", service, "-w"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  keychain: (service: string) => string | undefined = readKeychain,
): E2EConfig {
  const apiKey = env.E2E_FIXTURE_API_KEY || keychain(KEYCHAIN_SERVICE);
  if (!apiKey) {
    throw new Error(
      "E2E_FIXTURE_API_KEY is not set and the Keychain has no 'payit2-e2e-fixture-api-key' item. " +
        "Tests do not skip (PLATFORM-STANDARDS §3); see tests/README.md.",
    );
  }
  if (!/^pi2_(live|test)_/.test(apiKey)) {
    throw new Error("E2E_FIXTURE_API_KEY does not look like a PayIt2 key (expected a pi2_live_ or pi2_test_ prefix).");
  }
  const mcpUrl = env.E2E_MCP_URL || "https://dev.mcp.payit2.com/mcp";
  const apiUrl = env.E2E_API_URL || "https://dev.api.payit2.com";
  assertDevTarget(mcpUrl);
  assertDevTarget(apiUrl);
  return { apiKey, mcpUrl, apiUrl };
}
