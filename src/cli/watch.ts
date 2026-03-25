import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import * as https from "node:https";
import { loadConfig, readFileContent } from "../engine/files.js";
import { scanFile } from "../engine/scanner.js";
import type { Config, ScanResult } from "../types.js";

interface WatchOptions {
  webhook?: string;
  config?: string;
}

export function watchCommand(target: string, options: WatchOptions): void {
  const config = loadConfig(options.config);
  const watchPath = path.resolve(target);

  if (!fs.existsSync(watchPath)) {
    process.stderr.write(`Error: path not found: ${watchPath}\n`);
    process.exit(1);
  }

  process.stderr.write(`Watching ${watchPath} for changes...\n`);

  const webhookUrl = options.webhook ?? config.watchWebhook;

  fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const fullPath = path.join(watchPath, filename);
    const ext = path.extname(filename).toLowerCase();

    if (!config.fileTypes.includes(ext)) return;
    if (config.exclude.some((ex) => fullPath.includes(ex))) return;

    // Debounce: skip if file doesn't exist (might be deleted)
    if (!fs.existsSync(fullPath)) return;

    try {
      const content = readFileContent(fullPath);
      const result = scanFile(content, fullPath, config);

      if (result.findings.length > 0) {
        const output = JSON.stringify(result) + "\n";
        process.stdout.write(output);

        if (webhookUrl) {
          sendWebhook(webhookUrl, result);
        }
      }
    } catch {
      // File may be in the process of being written
    }
  });
}

function sendWebhook(url: string, result: ScanResult): void {
  const data = JSON.stringify(result);
  const parsed = new URL(url);
  const mod = parsed.protocol === "https:" ? https : http;

  const req = mod.request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        "User-Agent": "kekkai/1.0.0",
      },
    },
    (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        process.stderr.write(`Webhook returned ${res.statusCode}\n`);
      }
    }
  );

  req.on("error", (err) => {
    process.stderr.write(`Webhook error: ${err.message}\n`);
  });

  req.write(data);
  req.end();
}
