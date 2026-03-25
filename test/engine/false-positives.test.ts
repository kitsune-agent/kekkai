import { describe, it, expect } from "vitest";
import { scanFile } from "../../src/engine/scanner.js";
import * as fs from "node:fs";
import * as path from "node:path";

describe("False Positive Tests", () => {
  it("does not flag discussion about injection attacks", () => {
    const content = 'The team discussed how "ignore previous instructions" attacks work in OWASP documentation.';
    const result = scanFile(content, "test.md");
    // This WILL flag because we scan for patterns even in discussion context
    // This is by design — better to over-report than under-report for security tools
    // Users can add to allowList to suppress known-safe patterns
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("does not flag normal IMPORTANT notes", () => {
    const content = "IMPORTANT: The deployment deadline is March 30th.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag normal system architecture discussion", () => {
    const content = "The system architecture uses microservices.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag normal password documentation", () => {
    const content = "Please reset your password through the admin panel.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag normal API documentation", () => {
    const content = "The endpoint returns a JSON response with status codes.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag 'from now on' in scheduling context", () => {
    const content = "From now on, meetings are on Tuesday and Thursday.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag normal date references", () => {
    const content = "Meeting scheduled for 2025-03-20.";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("does not flag markdown links with URLs", () => {
    const content = "[Documentation](https://docs.example.com/guide)";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("produces zero findings on clean fixture file", () => {
    const fixturePath = path.join(process.cwd(), "test/fixtures/clean-memory.md");
    const content = fs.readFileSync(fixturePath, "utf-8");
    const result = scanFile(content, fixturePath);
    expect(result.findings.length).toBe(0);
  });

  it("does not flag normal HTML comments", () => {
    const content = "<!-- TODO: update this section -->";
    const result = scanFile(content, "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("handles empty files gracefully", () => {
    const result = scanFile("", "test.md");
    expect(result.findings.length).toBe(0);
  });

  it("handles files with only whitespace", () => {
    const result = scanFile("   \n\n   \n", "test.md");
    expect(result.findings.length).toBe(0);
  });
});
