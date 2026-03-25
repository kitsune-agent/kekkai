import type { Rule, RuleMatch } from "../types.js";

const smugglingPatterns: Array<{
  id: string;
  description: string;
  pattern: RegExp;
}> = [
  {
    id: "smuggling-remember-always",
    description: "Instruction smuggling: 'remember to always' in data context",
    pattern: /remember\s+to\s+always/i,
  },
  {
    id: "smuggling-from-now-on",
    description: "Instruction smuggling: 'from now on' directive",
    pattern: /from\s+now\s+on\s*,?\s+(you\s+)?(must|should|will|always|never)/i,
  },
  {
    id: "smuggling-conditional-trigger",
    description: "Instruction smuggling: conditional trigger pattern",
    pattern: /when\s+(the\s+)?user\s+asks?\s+(about|for)\s+.{1,50},\s*(respond|reply|say|answer|tell)/i,
  },
  {
    id: "smuggling-role-override",
    description: "Instruction smuggling: role reassignment in data",
    pattern: /your\s+(new\s+)?role\s+(is|will\s+be|should\s+be)/i,
  },
  {
    id: "smuggling-always-respond",
    description: "Instruction smuggling: 'always respond with'",
    pattern: /always\s+respond\s+(with|by|using)/i,
  },
  {
    id: "smuggling-never-reveal",
    description: "Instruction smuggling: 'never reveal'",
    pattern: /never\s+(reveal|disclose|share|tell|show)\s+(the|your|any|this)/i,
  },
  {
    id: "smuggling-must-follow",
    description: "Instruction smuggling: 'you must follow these'",
    pattern: /you\s+must\s+(follow|obey|comply|adhere)/i,
  },
  {
    id: "smuggling-secret-instruction",
    description: "Instruction smuggling: 'secret instruction'",
    pattern: /secret\s+(instruction|directive|command|rule)/i,
  },
  {
    id: "smuggling-override-behavior",
    description: "Instruction smuggling: behavior override",
    pattern: /override\s+(your\s+)?(default|normal|standard|current)\s+(behavior|response|rules)/i,
  },
  {
    id: "smuggling-hidden-directive",
    description: "Instruction smuggling: 'hidden' or 'embedded' directive",
    pattern: /(hidden|embedded|concealed)\s+(directive|instruction|command)/i,
  },
];

export function getSmugglingRules(): Rule[] {
  return smugglingPatterns.map(({ id, description, pattern }) => ({
    id,
    category: "instruction-smuggling" as const,
    severity: "high" as const,
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
