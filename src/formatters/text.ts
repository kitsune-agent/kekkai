import type { Finding, ScanResult, AuditReport } from "../types.js";

const severityColors: Record<string, string> = {
  critical: "\x1b[31m", // red
  high: "\x1b[33m",     // yellow
  medium: "\x1b[36m",   // cyan
  low: "\x1b[37m",      // white
  info: "\x1b[90m",     // gray
};
const reset = "\x1b[0m";
const bold = "\x1b[1m";

export function formatFinding(f: Finding): string {
  const color = severityColors[f.severity] ?? "";
  return [
    `  ${color}${bold}${f.severity.toUpperCase()}${reset} ${f.message}`,
    `    ${f.file}:${f.line}:${f.column}`,
    `    Rule: ${f.rule}`,
    f.context ? `    Context: ${f.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatScanResult(result: ScanResult): string {
  if (result.findings.length === 0) {
    return `${bold}✓${reset} ${result.file} — no findings`;
  }

  const lines = [`${bold}${result.file}${reset} — ${result.findings.length} finding(s)\n`];
  for (const f of result.findings) {
    lines.push(formatFinding(f));
  }
  return lines.join("\n");
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `${bold}Kekkai Audit Report${reset}`,
    `Scanned: ${report.totalFiles} files | Findings: ${report.totalFindings}`,
    "",
    `${bold}Findings by Severity:${reset}`,
  ];

  for (const [sev, count] of Object.entries(report.findingsBySeverity)) {
    if (count > 0) {
      const color = severityColors[sev] ?? "";
      lines.push(`  ${color}${sev.toUpperCase()}: ${count}${reset}`);
    }
  }

  lines.push("", `${bold}File Trust Scores:${reset}`);
  for (const fs of report.fileScores.sort((a, b) => a.score - b.score)) {
    const scoreColor = fs.score >= 80 ? "\x1b[32m" : fs.score >= 50 ? "\x1b[33m" : "\x1b[31m";
    lines.push(`  ${scoreColor}[${fs.score}]${reset} ${fs.file} (${fs.findings} findings)`);
  }

  return lines.join("\n");
}
