import type { Rule, RuleMatch } from "../types.js";

// Zero-width and invisible characters
const ZERO_WIDTH_SPACE = "\u200B";
const ZERO_WIDTH_NON_JOINER = "\u200C";
const ZERO_WIDTH_JOINER = "\u200D";
const ZERO_WIDTH_NO_BREAK = "\uFEFF";
const LEFT_TO_RIGHT_MARK = "\u200E";
const RIGHT_TO_LEFT_MARK = "\u200F";
const LEFT_TO_RIGHT_OVERRIDE = "\u202D";
const RIGHT_TO_LEFT_OVERRIDE = "\u202E";
const LEFT_TO_RIGHT_EMBEDDING = "\u202A";
const RIGHT_TO_LEFT_EMBEDDING = "\u202B";
const POP_DIRECTIONAL = "\u202C";
const LEFT_TO_RIGHT_ISOLATE = "\u2066";
const RIGHT_TO_LEFT_ISOLATE = "\u2067";
const FIRST_STRONG_ISOLATE = "\u2068";
const POP_DIRECTIONAL_ISOLATE = "\u2069";
const INVISIBLE_SEPARATOR = "\u2063";
const INVISIBLE_TIMES = "\u2062";
const INVISIBLE_PLUS = "\u2064";
const WORD_JOINER = "\u2060";

const zeroWidthPattern = new RegExp(
  `[${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}${ZERO_WIDTH_JOINER}${ZERO_WIDTH_NO_BREAK}${WORD_JOINER}${INVISIBLE_SEPARATOR}${INVISIBLE_TIMES}${INVISIBLE_PLUS}]`
);

const bidiPattern = new RegExp(
  `[${LEFT_TO_RIGHT_MARK}${RIGHT_TO_LEFT_MARK}${LEFT_TO_RIGHT_OVERRIDE}${RIGHT_TO_LEFT_OVERRIDE}${LEFT_TO_RIGHT_EMBEDDING}${RIGHT_TO_LEFT_EMBEDDING}${POP_DIRECTIONAL}${LEFT_TO_RIGHT_ISOLATE}${RIGHT_TO_LEFT_ISOLATE}${FIRST_STRONG_ISOLATE}${POP_DIRECTIONAL_ISOLATE}]`
);

// Homoglyph mappings: characters that look identical but have different code points
// Map of confusable Unicode → ASCII equivalent
const homoglyphSets: Record<string, string> = {
  "\u0410": "A", // Cyrillic А
  "\u0412": "B", // Cyrillic В
  "\u0421": "C", // Cyrillic С
  "\u0415": "E", // Cyrillic Е
  "\u041D": "H", // Cyrillic Н
  "\u041A": "K", // Cyrillic К
  "\u041C": "M", // Cyrillic М
  "\u041E": "O", // Cyrillic О
  "\u0420": "P", // Cyrillic Р
  "\u0422": "T", // Cyrillic Т
  "\u0425": "X", // Cyrillic Х
  "\u0430": "a", // Cyrillic а
  "\u0435": "e", // Cyrillic е
  "\u043E": "o", // Cyrillic о
  "\u0440": "p", // Cyrillic р
  "\u0441": "c", // Cyrillic с
  "\u0443": "y", // Cyrillic у
  "\u0445": "x", // Cyrillic х
  "\u0456": "i", // Cyrillic і
  "\u0458": "j", // Cyrillic ј
  "\u0455": "s", // Cyrillic ѕ
  "\u04BB": "h", // Cyrillic һ
  "\u0501": "d", // Cyrillic ԁ
  "\u051B": "q", // Cyrillic ԛ
  "\u051D": "w", // Cyrillic ԝ
};

const homoglyphChars = Object.keys(homoglyphSets);
const homoglyphPattern = new RegExp(`[${homoglyphChars.join("")}]`);

export function getUnicodeRules(): Rule[] {
  return [
    {
      id: "unicode-zero-width",
      category: "unicode-attacks",
      severity: "high",
      description: "Zero-width or invisible Unicode characters detected",
      test(line: string): RuleMatch[] {
        const match = zeroWidthPattern.exec(line);
        if (!match) return [];
        const charCode = match[0].codePointAt(0)!;
        return [
          {
            column: match.index + 1,
            context: `Invisible character U+${charCode.toString(16).toUpperCase().padStart(4, "0")} found in: ${line.trim().slice(0, 100)}`,
            pattern: `U+${charCode.toString(16).toUpperCase().padStart(4, "0")}`,
          },
        ];
      },
    },
    {
      id: "unicode-bidi-override",
      category: "unicode-attacks",
      severity: "high",
      description: "Bidirectional text override character detected",
      test(line: string): RuleMatch[] {
        const match = bidiPattern.exec(line);
        if (!match) return [];
        const charCode = match[0].codePointAt(0)!;
        return [
          {
            column: match.index + 1,
            context: `BiDi override U+${charCode.toString(16).toUpperCase().padStart(4, "0")} found in: ${line.trim().slice(0, 100)}`,
            pattern: `U+${charCode.toString(16).toUpperCase().padStart(4, "0")}`,
          },
        ];
      },
    },
    {
      id: "unicode-homoglyph",
      category: "unicode-attacks",
      severity: "high",
      description: "Homoglyph character detected (visually similar to ASCII)",
      test(line: string): RuleMatch[] {
        const match = homoglyphPattern.exec(line);
        if (!match) return [];
        const char = match[0];
        const latin = homoglyphSets[char];
        const charCode = char.codePointAt(0)!;
        return [
          {
            column: match.index + 1,
            context: `Homoglyph U+${charCode.toString(16).toUpperCase().padStart(4, "0")} (looks like '${latin}') in: ${line.trim().slice(0, 100)}`,
            pattern: `U+${charCode.toString(16).toUpperCase().padStart(4, "0")}→${latin}`,
          },
        ];
      },
    },
  ];
}
