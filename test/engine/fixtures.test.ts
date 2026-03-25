import { describe, it, expect } from "vitest";
import { scanFile } from "../../src/engine/scanner.js";
import * as fs from "node:fs";
import * as path from "node:path";

const FIXTURES = path.join(process.cwd(), "test/fixtures");

function scanFixture(filename: string) {
  const filePath = path.join(FIXTURES, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return scanFile(content, filePath);
}

describe("Fixture Integration Tests", () => {
  it("clean-memory.md has zero findings", () => {
    const result = scanFixture("clean-memory.md");
    expect(result.findings.length).toBe(0);
  });

  it("malicious-injection.md has multiple critical findings", () => {
    const result = scanFixture("malicious-injection.md");
    const critical = result.findings.filter((f) => f.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(5);
  });

  it("smuggling.md has high-severity findings", () => {
    const result = scanFixture("smuggling.md");
    const high = result.findings.filter((f) => f.severity === "high");
    expect(high.length).toBeGreaterThanOrEqual(5);
  });

  it("credentials.md detects all credential types", () => {
    const result = scanFixture("credentials.md");
    const credFindings = result.findings.filter((f) => f.category === "credential-exposure");
    expect(credFindings.length).toBeGreaterThanOrEqual(8);
  });

  it("unicode-attacks.md detects unicode issues", () => {
    const result = scanFixture("unicode-attacks.md");
    const unicodeFindings = result.findings.filter((f) => f.category === "unicode-attacks");
    expect(unicodeFindings.length).toBeGreaterThanOrEqual(2);
  });

  it("provenance-gaps.md detects provenance issues", () => {
    const result = scanFixture("provenance-gaps.md");
    const provFindings = result.findings.filter((f) => f.category === "provenance-gaps");
    expect(provFindings.length).toBeGreaterThanOrEqual(2);
  });

  it("memory.jsonl detects injection and credentials", () => {
    const result = scanFixture("memory.jsonl");
    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    const categories = new Set(result.findings.map((f) => f.category));
    expect(categories.has("prompt-injection")).toBe(true);
    expect(categories.has("credential-exposure")).toBe(true);
  });
});
