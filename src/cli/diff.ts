import { execSync } from "node:child_process";
import { scanFile } from "../engine/scanner.js";
import { loadConfig } from "../engine/files.js";
import type { Config, DiffEntry } from "../types.js";

interface DiffOptions {
  since?: string;
  format: "text" | "json";
  config?: string;
}

function execGit(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return "";
  }
}

export function diffCommand(target: string, options: DiffOptions): number {
  const config = loadConfig(options.config);
  const since = options.since ?? "HEAD~10";

  // Check if target is in a git repo
  const gitCheck = execGit("git rev-parse --is-inside-work-tree", target);
  if (!gitCheck.trim()) {
    process.stderr.write(`Error: ${target} is not inside a git repository\n`);
    return 1;
  }

  // Get file extensions for filtering
  const extPattern = config.fileTypes.map((e) => `*${e}`).join(" ");

  // Get git log of changes to memory files
  const logOutput = execGit(
    `git log ${since}..HEAD --diff-filter=AM --name-only --pretty=format:"%H|%aI|%an" -- ${extPattern}`,
    target
  );

  if (!logOutput.trim()) {
    process.stdout.write("No memory file changes found in the specified range.\n");
    return 0;
  }

  const entries = parseGitLog(logOutput, target, config);

  if (options.format === "json") {
    process.stdout.write(JSON.stringify(entries, null, 2) + "\n");
  } else {
    formatDiffText(entries);
  }

  const totalFindings = entries.reduce((sum, e) => sum + e.findings.length, 0);
  return totalFindings > 0 ? 1 : 0;
}

function parseGitLog(log: string, cwd: string, config: Config): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const lines = log.trim().split("\n");

  let currentCommit = "";
  let currentDate = "";
  let currentAuthor = "";

  for (const line of lines) {
    if (line.includes("|")) {
      const parts = line.split("|");
      currentCommit = parts[0].replace(/"/g, "");
      currentDate = parts[1] ?? "";
      currentAuthor = parts[2] ?? "";
    } else if (line.trim()) {
      const filePath = line.trim();
      // Get the diff content for this file at this commit
      const diffContent = execGit(
        `git show ${currentCommit}:${filePath}`,
        cwd
      );

      if (!diffContent) continue;

      const result = scanFile(diffContent, filePath, config);

      // Get only added lines
      const patchOutput = execGit(
        `git diff ${currentCommit}~1..${currentCommit} -- ${filePath}`,
        cwd
      );

      const additions = patchOutput
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .map((l) => l.slice(1));

      entries.push({
        file: filePath,
        commit: currentCommit.slice(0, 8),
        date: currentDate,
        author: currentAuthor,
        additions,
        findings: result.findings,
      });
    }
  }

  return entries;
}

function formatDiffText(entries: DiffEntry[]): void {
  for (const entry of entries) {
    process.stdout.write(
      `\n${entry.date} [${entry.commit}] ${entry.author}\n` +
        `  File: ${entry.file}\n` +
        `  Additions: ${entry.additions.length} lines\n`
    );

    if (entry.findings.length > 0) {
      process.stdout.write(`  ⚠ ${entry.findings.length} finding(s):\n`);
      for (const f of entry.findings) {
        process.stdout.write(
          `    ${f.severity.toUpperCase()} ${f.rule} (line ${f.line})\n`
        );
      }
    }
  }
}
