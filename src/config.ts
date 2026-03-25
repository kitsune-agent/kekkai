import type { Config } from "./types.js";

export const defaultConfig: Config = {
  rules: {
    "prompt-injection": { enabled: true, severity: "critical" },
    "instruction-smuggling": { enabled: true, severity: "high" },
    "credential-exposure": { enabled: true, severity: "critical" },
    "unicode-attacks": { enabled: true, severity: "high" },
    "provenance-gaps": { enabled: true, severity: "medium" },
  },
  allowList: [],
  fileTypes: [".md", ".jsonl", ".json", ".txt", ".yaml", ".yml"],
  exclude: ["node_modules", ".git", ".kekkai-quarantine"],
  watchWebhook: null,
  trustThreshold: 50,
};

export function mergeConfig(base: Config, override: Partial<Config>): Config {
  return {
    ...base,
    ...override,
    rules: { ...base.rules, ...override.rules },
    allowList: override.allowList ?? base.allowList,
    fileTypes: override.fileTypes ?? base.fileTypes,
    exclude: override.exclude ?? base.exclude,
  };
}
