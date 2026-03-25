import { describe, it, expect } from "vitest";
import { defaultConfig, mergeConfig } from "../../src/config.js";

describe("Config", () => {
  it("has all default categories enabled", () => {
    expect(defaultConfig.rules["prompt-injection"]?.enabled).toBe(true);
    expect(defaultConfig.rules["instruction-smuggling"]?.enabled).toBe(true);
    expect(defaultConfig.rules["credential-exposure"]?.enabled).toBe(true);
    expect(defaultConfig.rules["unicode-attacks"]?.enabled).toBe(true);
    expect(defaultConfig.rules["provenance-gaps"]?.enabled).toBe(true);
  });

  it("has correct default file types", () => {
    expect(defaultConfig.fileTypes).toContain(".md");
    expect(defaultConfig.fileTypes).toContain(".json");
    expect(defaultConfig.fileTypes).toContain(".jsonl");
    expect(defaultConfig.fileTypes).toContain(".yaml");
  });

  it("excludes common directories", () => {
    expect(defaultConfig.exclude).toContain("node_modules");
    expect(defaultConfig.exclude).toContain(".git");
  });

  it("merges configs correctly", () => {
    const merged = mergeConfig(defaultConfig, {
      rules: { "prompt-injection": { enabled: false, severity: "low" } },
    });
    expect(merged.rules["prompt-injection"]?.enabled).toBe(false);
    expect(merged.rules["credential-exposure"]?.enabled).toBe(true);
  });

  it("overrides allow list", () => {
    const merged = mergeConfig(defaultConfig, { allowList: ["safe-pattern"] });
    expect(merged.allowList).toEqual(["safe-pattern"]);
  });
});
