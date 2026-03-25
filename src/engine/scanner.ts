import type { Config, Finding, Rule, ScanResult } from "../types.js";
import { getInjectionRules } from "./injection.js";
import { getSmugglingRules } from "./smuggling.js";
import { getCredentialRules } from "./credentials.js";
import { getUnicodeRules } from "./unicode.js";
import { getProvenanceRules } from "./provenance.js";
import { defaultConfig } from "../config.js";

export function getAllRules(config?: Partial<Config>): Rule[] {
  const cfg = { ...defaultConfig, ...config };
  const rules: Rule[] = [];

  const ruleConfig = cfg.rules;

  if (ruleConfig["prompt-injection"]?.enabled !== false) {
    const severity = ruleConfig["prompt-injection"]?.severity;
    const injectionRules = getInjectionRules();
    if (severity) {
      injectionRules.forEach((r) => (r.severity = severity));
    }
    rules.push(...injectionRules);
  }

  if (ruleConfig["instruction-smuggling"]?.enabled !== false) {
    const severity = ruleConfig["instruction-smuggling"]?.severity;
    const smugglingRules = getSmugglingRules();
    if (severity) {
      smugglingRules.forEach((r) => (r.severity = severity));
    }
    rules.push(...smugglingRules);
  }

  if (ruleConfig["credential-exposure"]?.enabled !== false) {
    const severity = ruleConfig["credential-exposure"]?.severity;
    const credRules = getCredentialRules();
    if (severity) {
      credRules.forEach((r) => (r.severity = severity));
    }
    rules.push(...credRules);
  }

  if (ruleConfig["unicode-attacks"]?.enabled !== false) {
    const severity = ruleConfig["unicode-attacks"]?.severity;
    const unicodeRules = getUnicodeRules();
    if (severity) {
      unicodeRules.forEach((r) => (r.severity = severity));
    }
    rules.push(...unicodeRules);
  }

  if (ruleConfig["provenance-gaps"]?.enabled !== false) {
    const severity = ruleConfig["provenance-gaps"]?.severity;
    const provRules = getProvenanceRules();
    if (severity) {
      provRules.forEach((r) => (r.severity = severity));
    }
    rules.push(...provRules);
  }

  return rules;
}

export function scanContent(
  content: string,
  filePath: string,
  rules: Rule[],
  allowList: string[] = []
): Finding[] {
  const lines = content.split("\n");
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    for (const rule of rules) {
      const matches = rule.test(line, lineNumber, content, filePath);
      for (const match of matches) {
        // Check allow list
        const isAllowed = allowList.some(
          (pattern) => line.includes(pattern) || rule.id.includes(pattern)
        );
        if (isAllowed) continue;

        findings.push({
          rule: rule.id,
          category: rule.category,
          severity: rule.severity,
          message: rule.description,
          file: filePath,
          line: lineNumber,
          column: match.column,
          context: match.context,
          pattern: match.pattern,
        });
      }
    }
  }

  return findings;
}

export function scanFile(
  content: string,
  filePath: string,
  config?: Partial<Config>
): ScanResult {
  const cfg = { ...defaultConfig, ...config };
  const rules = getAllRules(cfg);
  const findings = scanContent(content, filePath, rules, cfg.allowList);

  return {
    file: filePath,
    findings,
    scannedAt: new Date().toISOString(),
  };
}
