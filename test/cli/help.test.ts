import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";

const CLI = path.join(process.cwd(), "dist/cli.js");

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", exitCode: err.status ?? 1 };
  }
}

describe("CLI help and version", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = run("--help");
    expect(stdout).toContain("kekkai");
    expect(stdout).toContain("scan");
    expect(stdout).toContain("watch");
    expect(stdout).toContain("audit");
    expect(stdout).toContain("diff");
    expect(stdout).toContain("quarantine");
    expect(stdout).toContain("init");
    expect(exitCode).toBe(0);
  });

  it("shows version with --version", () => {
    const { stdout, exitCode } = run("--version");
    expect(stdout).toContain("kekkai");
    expect(exitCode).toBe(0);
  });

  it("shows help for unknown command", () => {
    const { stdout, exitCode } = run("unknown-cmd");
    expect(stdout).toContain("kekkai");
    expect(exitCode).toBe(1);
  });
});
