import { describe, it, expect } from "vitest";
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

describe("CLI audit command", () => {
  it("generates audit report in text format", () => {
    const { stdout } = run(`audit ${FIXTURES}`);
    expect(stdout).toContain("Audit Report");
    expect(stdout).toContain("Findings by Severity");
  });

  it("generates audit report in JSON format", () => {
    const { stdout } = run(`audit ${FIXTURES} --format json`);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty("totalFiles");
    expect(parsed).toHaveProperty("totalFindings");
    expect(parsed).toHaveProperty("fileScores");
    expect(parsed).toHaveProperty("findingsBySeverity");
  });

  it("generates audit report in markdown format", () => {
    const { stdout } = run(`audit ${FIXTURES} --format markdown`);
    expect(stdout).toContain("# Kekkai Audit Report");
    expect(stdout).toContain("| Score |");
  });

  it("--ci exits non-zero when critical/high findings exist", () => {
    const { exitCode } = run(`audit ${FIXTURES} --ci`);
    expect(exitCode).toBe(1);
  });

  it("computes trust scores", () => {
    const { stdout } = run(`audit ${FIXTURES} --format json`);
    const parsed = JSON.parse(stdout);
    for (const score of parsed.fileScores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    }
  });
});
