import type { ScanResult, AuditReport } from "../types.js";

export function formatScanResultJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatAuditReportJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
