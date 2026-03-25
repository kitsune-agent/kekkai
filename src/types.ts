export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Category =
  | "prompt-injection"
  | "instruction-smuggling"
  | "credential-exposure"
  | "unicode-attacks"
  | "provenance-gaps";

export interface Finding {
  rule: string;
  category: Category;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  context: string;
  pattern?: string;
}

export interface ScanResult {
  file: string;
  findings: Finding[];
  scannedAt: string;
}

export interface AuditReport {
  scannedAt: string;
  totalFiles: number;
  totalFindings: number;
  fileScores: FileScore[];
  findingsBySeverity: Record<Severity, number>;
  findingsByCategory: Record<Category, number>;
  findings: Finding[];
}

export interface FileScore {
  file: string;
  score: number;
  findings: number;
  critical: number;
  high: number;
}

export interface Rule {
  id: string;
  category: Category;
  severity: Severity;
  description: string;
  test: (line: string, lineNumber: number, fullContent: string, filePath: string) => RuleMatch[];
}

export interface RuleMatch {
  column: number;
  context: string;
  pattern?: string;
}

export interface Config {
  rules: {
    [key in Category]?: {
      enabled: boolean;
      severity: Severity;
    };
  };
  allowList: string[];
  fileTypes: string[];
  exclude: string[];
  watchWebhook: string | null;
  trustThreshold: number;
}

export interface DiffEntry {
  file: string;
  commit: string;
  date: string;
  author: string;
  additions: string[];
  findings: Finding[];
}

export interface QuarantineEntry {
  id: string;
  file: string;
  line: number;
  content: string;
  finding: Finding;
  quarantinedAt: string;
}
