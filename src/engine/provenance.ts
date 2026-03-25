import type { Rule, RuleMatch } from "../types.js";

export function getProvenanceRules(): Rule[] {
  return [
    {
      id: "provenance-no-source",
      category: "provenance-gaps",
      severity: "medium",
      description: "Memory entry without source attribution",
      test(line: string, lineNumber: number, fullContent: string, filePath: string): RuleMatch[] {
        // Only check markdown files that look like memory entries
        if (!filePath.endsWith(".md")) return [];

        // Check if this looks like a memory entry header (## or ### followed by content)
        if (!/^#{2,3}\s+/.test(line)) return [];

        // Check if there's a [source: ...] tag nearby (within 5 lines)
        const lines = fullContent.split("\n");
        const start = Math.max(0, lineNumber - 1);
        const end = Math.min(lines.length, lineNumber + 5);
        const vicinity = lines.slice(start, end).join("\n");

        if (/\[source:\s*.+\]/i.test(vicinity)) return [];
        if (/source\s*[:=]\s*.+/i.test(vicinity)) return [];

        return [
          {
            column: 1,
            context: line.trim().slice(0, 200),
          },
        ];
      },
    },
    {
      id: "provenance-external-no-trust",
      category: "provenance-gaps",
      severity: "medium",
      description: "External content reference without trust level marker",
      test(line: string): RuleMatch[] {
        // Check for external source indicators
        const externalPattern = /\b(email|webhook|external|imported|ingested)\b.*\b(source|data|content|feed|input)\b|\b(source|data|content|feed|input)\b.*\b(email|webhook|external|imported|ingested)\b|\bimported\s+from\b|\bingested\s+from\b|\breceived\s+via\b|\bfrom\s+(email|webhook)\b/i;
        if (!externalPattern.test(line)) return [];

        // Check if trust level is indicated
        if (/\btrust[_\s-]?(level|score)?\s*[:=]\s*/i.test(line)) return [];
        if (/\b(verified|unverified|trusted|untrusted)\b/i.test(line)) return [];

        const match = externalPattern.exec(line)!;
        return [
          {
            column: match.index + 1,
            context: line.trim().slice(0, 200),
            pattern: match[0],
          },
        ];
      },
    },
    {
      id: "provenance-bare-url",
      category: "provenance-gaps",
      severity: "low",
      description: "External URL reference without context or attribution",
      test(line: string): RuleMatch[] {
        const urlPattern = /https?:\/\/[^\s)>\]]{10,}/;
        const match = urlPattern.exec(line);
        if (!match) return [];

        // If URL has surrounding context (markdown link, description), it's fine
        if (/\[.+\]\(https?:\/\//.test(line)) return [];
        if (line.trim().length > match[0].length + 20) return [];

        return [
          {
            column: match.index + 1,
            context: line.trim().slice(0, 200),
            pattern: match[0].slice(0, 50),
          },
        ];
      },
    },
    {
      id: "provenance-future-date",
      category: "provenance-gaps",
      severity: "medium",
      description: "Temporal anomaly: future date in memory entry",
      test(line: string): RuleMatch[] {
        // Match ISO dates like 2025-03-15 or 2025/03/15
        const datePattern = /\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/;
        const match = datePattern.exec(line);
        if (!match) return [];

        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const entryDate = new Date(year, month, day);
        const now = new Date();
        // Allow 1 day tolerance for timezone differences
        const tolerance = new Date(now.getTime() + 86400000);

        if (entryDate <= tolerance) return [];

        return [
          {
            column: match.index + 1,
            context: line.trim().slice(0, 200),
            pattern: match[0],
          },
        ];
      },
    },
  ];
}
