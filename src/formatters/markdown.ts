import type { AuditReport, ScanResult } from "../types.js";

export function formatScanResultMarkdown(result: ScanResult): string {
  if (result.findings.length === 0) {
    return `### ✓ ${result.file}\n\nNo findings.\n`;
  }

  const lines = [`### ${result.file} — ${result.findings.length} finding(s)\n`];

  for (const f of result.findings) {
    lines.push(`- **${f.severity.toUpperCase()}** \`${f.rule}\` (line ${f.line})`);
    lines.push(`  ${f.message}`);
    if (f.context) {
      lines.push(`  > ${f.context}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function formatAuditReportMarkdown(report: AuditReport): string {
  const lines: string[] = [
    "# Kekkai Audit Report\n",
    `**Scanned:** ${report.totalFiles} files | **Findings:** ${report.totalFindings}\n`,
    "## Findings by Severity\n",
    "| Severity | Count |",
    "|----------|-------|",
  ];

  for (const [sev, count] of Object.entries(report.findingsBySeverity)) {
    lines.push(`| ${sev} | ${count} |`);
  }

  lines.push("", "## File Trust Scores\n", "| Score | File | Findings |", "|-------|------|----------|");

  for (const fs of report.fileScores.sort((a, b) => a.score - b.score)) {
    lines.push(`| ${fs.score} | ${fs.file} | ${fs.findings} |`);
  }

  if (report.findings.length > 0) {
    lines.push("", "## All Findings\n");
    for (const f of report.findings) {
      lines.push(`- **${f.severity.toUpperCase()}** \`${f.rule}\` — ${f.file}:${f.line}`);
      lines.push(`  ${f.message}`);
      if (f.context) {
        lines.push(`  > ${f.context}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
