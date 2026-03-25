import * as fs from "node:fs";
import { collectFiles, loadConfig, readFileContent } from "../engine/files.js";
import { scanFile } from "../engine/scanner.js";
import { formatScanResult } from "../formatters/text.js";
import { formatScanResultJson } from "../formatters/json.js";
import { formatSarif } from "../formatters/sarif.js";
import { formatScanResultMarkdown } from "../formatters/markdown.js";
import type { Severity, ScanResult } from "../types.js";

interface ScanOptions {
  format: "text" | "json" | "sarif" | "markdown";
  severity?: Severity;
  config?: string;
}

export function scanCommand(target: string, options: ScanOptions): number {
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

  const results: ScanResult[] = [];

  for (const file of files) {
    const content = readFileContent(file);
    const result = scanFile(content, file, config);

    // Filter by severity if specified
    if (options.severity) {
      const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
      const minIndex = severityOrder.indexOf(options.severity);
      result.findings = result.findings.filter(
        (f) => severityOrder.indexOf(f.severity) <= minIndex
      );
    }

    results.push(result);
  }

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);

  switch (options.format) {
    case "json":
      process.stdout.write(JSON.stringify(results, null, 2) + "\n");
      break;
    case "sarif":
      process.stdout.write(formatSarif(results) + "\n");
      break;
    case "markdown":
      for (const result of results) {
        process.stdout.write(formatScanResultMarkdown(result) + "\n");
      }
      break;
    default:
      for (const result of results) {
        process.stdout.write(formatScanResult(result) + "\n");
      }
      break;
  }

  return totalFindings > 0 ? 1 : 0;
}
