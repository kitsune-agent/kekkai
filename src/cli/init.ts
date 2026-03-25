import * as fs from "node:fs";
import { defaultConfig } from "../config.js";

export function initCommand(): number {
  const configPath = ".kekkairc.json";

  if (fs.existsSync(configPath)) {
    process.stderr.write(`Config already exists: ${configPath}\n`);
    return 1;
  }

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + "\n");
  process.stdout.write(`Created ${configPath}\n`);
  return 0;
}
