import type { Rule, RuleMatch } from "../types.js";

const injectionPatterns: Array<{
  id: string;
  description: string;
  pattern: RegExp;
}> = [
  {
    id: "injection-ignore-previous",
    description: "Prompt injection: ignore previous instructions",
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules|context)/i,
  },
  {
    id: "injection-ignore-all-prior",
    description: "Prompt injection: ignore all prior directives",
    pattern: /ignore\s+all\s+prior/i,
  },
  {
    id: "injection-you-are-now",
    description: "Prompt injection: role reassignment via 'you are now'",
    pattern: /you\s+are\s+now\s+(?:a\s+)?[a-zA-Z]/i,
  },
  {
    id: "injection-system-prefix",
    description: "Prompt injection: system: prefix in non-system context",
    pattern: /^system\s*:/i,
  },
  {
    id: "injection-important-override",
    description: "Prompt injection: IMPORTANT: followed by instruction override",
    pattern: /^IMPORTANT\s*:\s*.*(must|always|never|ignore|override|forget|disregard)/i,
  },
  {
    id: "injection-do-not-tell",
    description: "Prompt injection: 'do not tell the user'",
    pattern: /do\s+not\s+tell\s+the\s+user/i,
  },
  {
    id: "injection-pretend",
    description: "Prompt injection: 'pretend you are'",
    pattern: /pretend\s+(you\s+are|to\s+be|you're)/i,
  },
  {
    id: "injection-hidden-whitespace",
    description: "Prompt injection: hidden instructions after excessive whitespace",
    pattern: /\S {50,}\S/,
  },
  {
    id: "injection-html-comment",
    description: "Prompt injection: hidden instructions in HTML/markdown comments",
    pattern: /<!--[\s\S]*?(ignore|override|instruction|system|pretend|secret|do not)[\s\S]*?-->/i,
  },
  {
    id: "injection-new-instructions",
    description: "Prompt injection: 'new instructions' or 'updated instructions'",
    pattern: /(new|updated|revised|override)\s+instructions?\s*:/i,
  },
  {
    id: "injection-act-as",
    description: "Prompt injection: 'act as' role reassignment",
    pattern: /act\s+as\s+(a\s+|an\s+)?[a-zA-Z]/i,
  },
  {
    id: "injection-disregard",
    description: "Prompt injection: disregard previous/above",
    pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier)/i,
  },
  {
    id: "injection-forget-everything",
    description: "Prompt injection: forget everything",
    pattern: /forget\s+(everything|all|about)/i,
  },
  {
    id: "injection-jailbreak-dan",
    description: "Prompt injection: DAN-style jailbreak pattern",
    pattern: /\bDAN\b.*\b(mode|enabled|jailbreak|anything)\b/i,
  },
  {
    id: "injection-begin-response",
    description: "Prompt injection: forced response start",
    pattern: /begin\s+(your\s+)?response\s+with/i,
  },
];

export function getInjectionRules(): Rule[] {
  return injectionPatterns.map(({ id, description, pattern }) => ({
    id,
    category: "prompt-injection" as const,
    severity: "critical" as const,
    description,
    test(line: string, _lineNumber: number, _fullContent: string, _filePath: string): RuleMatch[] {
      const match = pattern.exec(line);
      if (!match) return [];
      return [
        {
          column: match.index + 1,
          context: line.trim().slice(0, 200),
          pattern: match[0],
        },
      ];
    },
  }));
}
