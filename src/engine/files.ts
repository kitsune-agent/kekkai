import * as fs from "node:fs";
import * as path from "node:path";
import type { Config } from "../types.js";
import { defaultConfig } from "../config.js";

export function loadConfig(configPath?: string): Config {
  const searchPaths = configPath
    ? [configPath]
    : [".kekkairc.json", ".kekkairc", "kekkai.config.json"];

  for (const p of searchPaths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      const parsed = JSON.parse(content) as Partial<Config>;
      return { ...defaultConfig, ...parsed, rules: { ...defaultConfig.rules, ...parsed.rules } };
    } catch {
      // Not found, continue
    }
  }

  return { ...defaultConfig };
}

export function collectFiles(target: string, config: Config): string[] {
  const files: string[] = [];
  const stat = fs.statSync(target);

  if (stat.isFile()) {
    if (isScannableFile(target, config)) {
      files.push(path.resolve(target));
    }
    return files;
  }

  if (stat.isDirectory()) {
    walkDir(path.resolve(target), files, config);
  }

  return files;
}

function walkDir(dir: string, files: string[], config: Config): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (config.exclude.some((ex) => entry.name === ex || fullPath.includes(ex))) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDir(fullPath, files, config);
    } else if (entry.isFile() && isScannableFile(entry.name, config)) {
      files.push(fullPath);
    }
  }
}

function isScannableFile(filePath: string, config: Config): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return config.fileTypes.includes(ext);
}

export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}
