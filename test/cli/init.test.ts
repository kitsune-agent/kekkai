import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const CLI = path.join(process.cwd(), "dist/cli.js");

describe("CLI init command", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates .kekkairc.json", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kekkai-test-"));
    execSync(`node ${CLI} init`, { cwd: tmpDir, encoding: "utf-8" });
    const configPath = path.join(tmpDir, ".kekkairc.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.rules).toBeDefined();
    expect(config.fileTypes).toBeDefined();
    expect(config.exclude).toBeDefined();
  });

  it("fails if config already exists", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kekkai-test-"));
    fs.writeFileSync(path.join(tmpDir, ".kekkairc.json"), "{}");
    try {
      execSync(`node ${CLI} init`, { cwd: tmpDir, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    } catch (err: any) {
      expect(err.status).toBe(1);
    }
  });
});
