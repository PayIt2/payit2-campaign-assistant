import { describe, it, expect } from "vitest";
import { assertDevTarget, loadConfig } from "./env.js";

const KEY = "pi2_live_0123456789abcdef";
const noKeychain = () => undefined;

describe("assertDevTarget", () => {
  it("accepts dev hosts and localhost", () => {
    expect(() => assertDevTarget("https://dev.mcp.payit2.com/mcp")).not.toThrow();
    expect(() => assertDevTarget("https://dev.api.payit2.com")).not.toThrow();
    expect(() => assertDevTarget("http://localhost:3003/mcp")).not.toThrow();
  });
  it("refuses production and foreign hosts", () => {
    expect(() => assertDevTarget("https://mcp.payit2.com/mcp")).toThrow(/Refusing/);
    expect(() => assertDevTarget("https://api.payit2.com")).toThrow(/Refusing/);
    expect(() => assertDevTarget("https://dev.example.com")).toThrow(/Refusing/);
  });
});

describe("loadConfig", () => {
  it("fails loudly when no key is available", () => {
    expect(() => loadConfig({}, noKeychain)).toThrow(/E2E_FIXTURE_API_KEY/);
  });
  it("rejects a value that is not a PayIt2 key", () => {
    expect(() => loadConfig({ E2E_FIXTURE_API_KEY: "hello" }, noKeychain)).toThrow(/pi2_live_/);
  });
  it("uses dev defaults", () => {
    expect(loadConfig({ E2E_FIXTURE_API_KEY: KEY }, noKeychain)).toEqual({
      apiKey: KEY,
      mcpUrl: "https://dev.mcp.payit2.com/mcp",
      apiUrl: "https://dev.api.payit2.com",
    });
  });
  it("falls back to the Keychain", () => {
    expect(loadConfig({}, () => KEY).apiKey).toBe(KEY);
  });
  it("refuses a production override", () => {
    expect(() =>
      loadConfig({ E2E_FIXTURE_API_KEY: KEY, E2E_API_URL: "https://api.payit2.com" }, noKeychain),
    ).toThrow(/Refusing/);
  });
});
