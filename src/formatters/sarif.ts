import type { Finding, ScanResult } from "../types.js";

interface SarifLog {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
}

interface SarifRule {
  id: string;
  shortDescription: { text: string };
  defaultConfiguration: { level: string };
  properties: { category: string };
}

interface SarifResult {
  ruleId: string;
  level: string;
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn: number };
    };
  }>;
}

function severityToLevel(severity: string): string {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
      return "note";
    default:
      return "warning";
  }
}

export function toSarif(results: ScanResult[]): SarifLog {
  const allFindings = results.flatMap((r) => r.findings);
  const ruleMap = new Map<string, Finding>();

  for (const f of allFindings) {
    if (!ruleMap.has(f.rule)) {
      ruleMap.set(f.rule, f);
    }
  }

  const rules: SarifRule[] = Array.from(ruleMap.entries()).map(([id, f]) => ({
    id,
    shortDescription: { text: f.message },
    defaultConfiguration: { level: severityToLevel(f.severity) },
    properties: { category: f.category },
  }));

  const sarifResults: SarifResult[] = allFindings.map((f) => ({
    ruleId: f.rule,
    level: severityToLevel(f.severity),
    message: { text: f.context || f.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.file },
          region: { startLine: f.line, startColumn: f.column },
        },
      },
    ],
  }));

  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "kekkai",
            version: "1.0.0",
            informationUri: "https://github.com/kitsune-agent/kekkai",
            rules,
          },
        },
        results: sarifResults,
      },
    ],
  };
}

export function formatSarif(results: ScanResult[]): string {
  return JSON.stringify(toSarif(results), null, 2);
}
