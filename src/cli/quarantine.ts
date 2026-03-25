import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { loadConfig, readFileContent } from "../engine/files.js";
import { scanFile } from "../engine/scanner.js";
import type { QuarantineEntry } from "../types.js";

const QUARANTINE_DIR = ".kekkai-quarantine";
const MANIFEST_FILE = "manifest.json";

interface QuarantineOptions {
  file?: string;
  line?: number;
  action: "isolate" | "list" | "restore";
  id?: string;
  config?: string;
}

function ensureQuarantineDir(basePath: string): string {
  const qDir = path.join(basePath, QUARANTINE_DIR);
  if (!fs.existsSync(qDir)) {
    fs.mkdirSync(qDir, { recursive: true });
  }
  return qDir;
}

function loadManifest(qDir: string): QuarantineEntry[] {
  const manifestPath = path.join(qDir, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as QuarantineEntry[];
  } catch {
    return [];
  }
}

function saveManifest(qDir: string, entries: QuarantineEntry[]): void {
  fs.writeFileSync(
    path.join(qDir, MANIFEST_FILE),
    JSON.stringify(entries, null, 2)
  );
}

export function quarantineCommand(target: string, options: QuarantineOptions): number {
  switch (options.action) {
    case "isolate":
      return isolate(target, options);
    case "list":
      return list(target);
    case "restore":
      return restore(target, options);
    default:
      process.stderr.write(`Unknown action: ${options.action}\n`);
      return 1;
  }
}

function isolate(target: string, options: QuarantineOptions): number {
  if (!options.file) {
    process.stderr.write("Error: --file is required for quarantine isolate\n");
    return 1;
  }

  const filePath = path.resolve(options.file);
  if (!fs.existsSync(filePath)) {
    process.stderr.write(`Error: file not found: ${filePath}\n`);
    return 1;
  }

  const config = loadConfig(options.config);
  const content = readFileContent(filePath);
  const lines = content.split("\n");

  // If line specified, quarantine that line. Otherwise, quarantine lines with findings.
  const result = scanFile(content, filePath, config);

  if (result.findings.length === 0 && !options.line) {
    process.stdout.write("No findings to quarantine.\n");
    return 0;
  }

  const qDir = ensureQuarantineDir(target);
  const manifest = loadManifest(qDir);

  const linesToQuarantine = options.line
    ? [options.line]
    : [...new Set(result.findings.map((f) => f.line))];

  const newLines = [...lines];
  let quarantined = 0;

  for (const lineNum of linesToQuarantine.sort((a, b) => b - a)) {
    if (lineNum < 1 || lineNum > lines.length) continue;

    const lineContent = lines[lineNum - 1];
    const id = crypto.randomUUID().slice(0, 8);
    const finding = result.findings.find((f) => f.line === lineNum) ?? {
      rule: "manual",
      category: "prompt-injection" as const,
      severity: "medium" as const,
      message: "Manually quarantined",
      file: filePath,
      line: lineNum,
      column: 1,
      context: lineContent.trim().slice(0, 200),
    };

    const entry: QuarantineEntry = {
      id,
      file: filePath,
      line: lineNum,
      content: lineContent,
      finding,
      quarantinedAt: new Date().toISOString(),
    };

    manifest.push(entry);
    newLines[lineNum - 1] = `<!-- [kekkai-quarantined:${id}] -->`;
    quarantined++;
  }

  fs.writeFileSync(filePath, newLines.join("\n"));
  saveManifest(qDir, manifest);

  process.stdout.write(`Quarantined ${quarantined} line(s). IDs:\n`);
  for (const entry of manifest.slice(-quarantined)) {
    process.stdout.write(`  ${entry.id}: line ${entry.line} from ${entry.file}\n`);
  }

  return 0;
}

function list(target: string): number {
  const qDir = path.join(target, QUARANTINE_DIR);
  const manifest = loadManifest(qDir);

  if (manifest.length === 0) {
    process.stdout.write("No quarantined entries.\n");
    return 0;
  }

  process.stdout.write(`${manifest.length} quarantined entries:\n\n`);
  for (const entry of manifest) {
    process.stdout.write(
      `  [${entry.id}] ${entry.file}:${entry.line}\n` +
        `    Severity: ${entry.finding.severity}\n` +
        `    Rule: ${entry.finding.rule}\n` +
        `    Content: ${entry.content.trim().slice(0, 80)}\n` +
        `    Quarantined: ${entry.quarantinedAt}\n\n`
    );
  }

  return 0;
}

function restore(target: string, options: QuarantineOptions): number {
  if (!options.id) {
    process.stderr.write("Error: --id is required for quarantine restore\n");
    return 1;
  }

  const qDir = path.join(target, QUARANTINE_DIR);
  const manifest = loadManifest(qDir);

  const entryIndex = manifest.findIndex((e) => e.id === options.id);
  if (entryIndex === -1) {
    process.stderr.write(`Error: quarantine entry not found: ${options.id}\n`);
    return 1;
  }

  const entry = manifest[entryIndex];

  if (!fs.existsSync(entry.file)) {
    process.stderr.write(`Error: original file no longer exists: ${entry.file}\n`);
    return 1;
  }

  const content = readFileContent(entry.file);
  const placeholder = `<!-- [kekkai-quarantined:${entry.id}] -->`;
  const restored = content.replace(placeholder, entry.content);

  fs.writeFileSync(entry.file, restored);
  manifest.splice(entryIndex, 1);
  saveManifest(qDir, manifest);

  process.stdout.write(`Restored entry ${entry.id} to ${entry.file}:${entry.line}\n`);
  return 0;
}
