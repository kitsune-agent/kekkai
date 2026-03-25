import { describe, it, expect } from "vitest";
import { getUnicodeRules } from "../../src/engine/unicode.js";
import { scanContent } from "../../src/engine/scanner.js";

const rules = getUnicodeRules();

function scan(text: string) {
  return scanContent(text, "test.md", rules);
}

describe("Unicode Attack Detection", () => {
  describe("zero-width characters", () => {
    it("detects zero-width space (U+200B)", () => {
      const findings = scan("normal\u200Btext");
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].rule).toBe("unicode-zero-width");
    });

    it("detects zero-width non-joiner (U+200C)", () => {
      const findings = scan("normal\u200Ctext");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects zero-width joiner (U+200D)", () => {
      const findings = scan("normal\u200Dtext");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects byte order mark (U+FEFF)", () => {
      const findings = scan("normal\uFEFFtext");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects word joiner (U+2060)", () => {
      const findings = scan("normal\u2060text");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects invisible separator (U+2063)", () => {
      const findings = scan("normal\u2063text");
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe("BiDi overrides", () => {
    it("detects RTL override (U+202E)", () => {
      const findings = scan("text\u202Eoverride");
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].rule).toBe("unicode-bidi-override");
    });

    it("detects LTR override (U+202D)", () => {
      const findings = scan("text\u202Doverride");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects RTL isolate (U+2067)", () => {
      const findings = scan("text\u2067isolate");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects LTR mark (U+200E)", () => {
      const findings = scan("text\u200Emark");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects RTL mark (U+200F)", () => {
      const findings = scan("text\u200Fmark");
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe("homoglyphs", () => {
    it("detects Cyrillic а (U+0430) masquerading as Latin a", () => {
      const findings = scan("p\u0430ssword");
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].rule).toBe("unicode-homoglyph");
    });

    it("detects Cyrillic о (U+043E) masquerading as Latin o", () => {
      const findings = scan("passw\u043Erd");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects Cyrillic с (U+0441) masquerading as Latin c", () => {
      const findings = scan("\u0441ommand");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("detects Cyrillic е (U+0435) masquerading as Latin e", () => {
      const findings = scan("s\u0435cret");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("does not flag normal ASCII text", () => {
      const findings = scan("This is normal text with no homoglyphs.");
      expect(findings.length).toBe(0);
    });
  });
});
