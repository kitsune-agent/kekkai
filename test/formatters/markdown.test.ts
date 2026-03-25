import { describe, it, expect } from "vitest";
import { formatScanResultMarkdown, formatAuditReportMarkdown } from "../../src/formatters/markdown.js";
import type { Finding, ScanResult, AuditReport } from "../../src/types.js";

describe("Markdown Formatter", () => {
  const finding: Finding = {
    rule: "injection-ignore-previous",
    category: "prompt-injection",
    severity: "critical",
    message: "Prompt injection detected",
    file: "test.md",
    line: 5,
    column: 1,
    context: "ignore previous instructions",
  };

  it("formats clean scan result", () => {
    const result: ScanResult = { file: "clean.md", findings: [], scannedAt: "2025-01-01" };
    const output = formatScanResultMarkdown(result);
    expect(output).toContain("No findings");
  });

  it("formats scan result with findings as markdown", () => {
    const result: ScanResult = { file: "bad.md", findings: [finding], scannedAt: "2025-01-01" };
    const output = formatScanResultMarkdown(result);
    expect(output).toContain("### bad.md");
    expect(output).toContain("**CRITICAL**");
    expect(output).toContain("`injection-ignore-previous`");
  });

  it("formats audit report as markdown table", () => {
    const report: AuditReport = {
      scannedAt: "2025-01-01",
      totalFiles: 2,
      totalFindings: 1,
      fileScores: [{ file: "test.md", score: 75, findings: 1, critical: 1, high: 0 }],
      findingsBySeverity: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
      findingsByCategory: { "prompt-injection": 1, "instruction-smuggling": 0, "credential-exposure": 0, "unicode-attacks": 0, "provenance-gaps": 0 },
      findings: [finding],
    };
    const output = formatAuditReportMarkdown(report);
    expect(output).toContain("# Kekkai Audit Report");
    expect(output).toContain("| Score | File |");
    expect(output).toContain("| 75 |");
  });
});
