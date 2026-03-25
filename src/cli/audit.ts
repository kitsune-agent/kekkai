import * as fs from "node:fs";
import { collectFiles, loadConfig, readFileContent } from "../engine/files.js";
import { scanFile } from "../engine/scanner.js";
import { formatAuditReport } from "../formatters/text.js";
import { formatAuditReportJson } from "../formatters/json.js";
import { formatAuditReportMarkdown } from "../formatters/markdown.js";
import type { AuditReport, Category, FileScore, Finding, Severity } from "../types.js";

interface AuditOptions {
  format: "text" | "json" | "markdown";
  ci?: boolean;
  config?: string;
}

function computeTrustScore(findings: Finding[]): number {
  let score = 100;

  for (const f of findings) {
    switch (f.severity) {
      case "critical":
        score -= 25;
        break;
      case "high":
        score -= 15;
        break;
      case "medium":
        score -= 8;
        break;
      case "low":
        score -= 3;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function auditCommand(target: string, options: AuditOptions): number {
  const config = loadConfig(options.config);

  if (!fs.existsSync(target)) {
    process.stderr.write(`Error: path not found: ${target}\n`);
    return 1;
  }

  const files = collectFiles(target, config);

  if (files.length === 0) {
    process.stderr.write(`No scannable files found in: ${target}\n`);
    return 0;
  }

  const allFindings: Finding[] = [];
  const fileScores: FileScore[] = [];

  for (const file of files) {
    const content = readFileContent(file);
    const result = scanFile(content, file, config);
    allFindings.push(...result.findings);

    fileScores.push({
      file,
      score: computeTrustScore(result.findings),
      findings: result.findings.length,
      critical: result.findings.filter((f) => f.severity === "critical").length,
      high: result.findings.filter((f) => f.severity === "high").length,
    });
  }

  const findingsBySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const findingsByCategory: Record<Category, number> = {
    "prompt-injection": 0,
    "instruction-smuggling": 0,
    "credential-exposure": 0,
    "unicode-attacks": 0,
    "provenance-gaps": 0,
  };

  for (const f of allFindings) {
    findingsBySeverity[f.severity]++;
    findingsByCategory[f.category]++;
  }

  const report: AuditReport = {
    scannedAt: new Date().toISOString(),
    totalFiles: files.length,
    totalFindings: allFindings.length,
    fileScores,
    findingsBySeverity,
    findingsByCategory,
    findings: allFindings,
  };

  switch (options.format) {
    case "json":
      process.stdout.write(formatAuditReportJson(report) + "\n");
      break;
    case "markdown":
      process.stdout.write(formatAuditReportMarkdown(report) + "\n");
      break;
    default:
      process.stdout.write(formatAuditReport(report) + "\n");
      break;
  }

  if (options.ci) {
    const hasCriticalOrHigh =
      findingsBySeverity.critical > 0 || findingsBySeverity.high > 0;
    return hasCriticalOrHigh ? 1 : 0;
  }

  return 0;
}
