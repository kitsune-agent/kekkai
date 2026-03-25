import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";

const CLI = path.join(process.cwd(), "dist/cli.js");
const FIXTURES = path.join(process.cwd(), "test/fixtures");

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      exitCode: err.status ?? 1,
    };
  }
}

describe("CLI scan command", () => {
  it("scans a clean file with no findings", () => {
    const { stdout, exitCode } = run(`scan ${FIXTURES}/clean-memory.md`);
    expect(stdout).toContain("no findings");
    expect(exitCode).toBe(0);
  });

  it("detects injection in malicious file", () => {
    const { exitCode } = run(`scan ${FIXTURES}/malicious-injection.md`);
    expect(exitCode).toBe(1);
  });

  it("outputs JSON format", () => {
    const { stdout } = run(`scan ${FIXTURES}/malicious-injection.md --format json`);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].findings.length).toBeGreaterThan(0);
  });

  it("outputs SARIF format", () => {
    const { stdout } = run(`scan ${FIXTURES}/malicious-injection.md --format sarif`);
    const parsed = JSON.parse(stdout);
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs).toHaveLength(1);
  });

  it("outputs markdown format", () => {
    const { stdout } = run(`scan ${FIXTURES}/malicious-injection.md --format markdown`);
    expect(stdout).toContain("**CRITICAL**");
  });

  it("filters by severity", () => {
    const { stdout } = run(`scan ${FIXTURES}/malicious-injection.md --format json --severity critical`);
    const parsed = JSON.parse(stdout);
    const severities = parsed[0].findings.map((f: any) => f.severity);
    expect(severities.every((s: string) => s === "critical")).toBe(true);
  });

  it("scans a directory", () => {
    const { exitCode } = run(`scan ${FIXTURES}`);
    expect(exitCode).toBe(1); // fixtures have malicious content
  });

  it("handles non-existent path", () => {
    const { stderr, exitCode } = run("scan /nonexistent/path");
    expect(exitCode).toBe(1);
    expect(stderr).toContain("not found");
  });

  it("scans JSONL files", () => {
    const { stdout } = run(`scan ${FIXTURES}/memory.jsonl --format json`);
    const parsed = JSON.parse(stdout);
    expect(parsed[0].findings.length).toBeGreaterThan(0);
  });
});
