import { scanCommand } from "./cli/scan.js";
import { watchCommand } from "./cli/watch.js";
import { auditCommand } from "./cli/audit.js";
import { diffCommand } from "./cli/diff.js";
import { quarantineCommand } from "./cli/quarantine.js";
import { initCommand } from "./cli/init.js";
import type { Severity } from "./types.js";

const VERSION = "1.0.0";

function printHelp(): void {
  process.stdout.write(`
kekkai (結界) v${VERSION} — Memory integrity scanner for AI agents

Usage: kekkai <command> [options]

Commands:
  scan <path>           Scan files/directories for threats
  watch <path>          Real-time file monitoring
  audit <path>          Generate integrity audit report
  diff <path>           Compare memory state across git commits
  quarantine <path>     Isolate/list/restore suspicious entries
  init                  Create .kekkairc.json config

Scan options:
  --format <fmt>        Output format: text, json, sarif, markdown (default: text)
  --severity <level>    Minimum severity: critical, high, medium, low, info
  --config <path>       Path to config file

Watch options:
  --webhook <url>       Send findings to webhook URL

Audit options:
  --format <fmt>        Output format: text, json, markdown (default: text)
  --ci                  Exit non-zero on critical/high findings

Diff options:
  --since <commit>      Git commit/ref to diff from (default: HEAD~10)
  --format <fmt>        Output format: text, json (default: text)

Quarantine actions:
  quarantine <path> --file <f> [--line <n>]    Isolate suspicious content
  quarantine <path> --list                     List quarantined entries
  quarantine <path> --restore --id <id>        Restore quarantined entry

General:
  --help, -h            Show this help
  --version, -v         Show version
`);
}

function parseArgs(argv: string[]): { command: string; target: string; flags: Record<string, string | boolean> } {
  const args = argv.slice(2);
  let command = "";
  let target = "";
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith("-")) {
      flags[arg.slice(1)] = true;
    } else if (!command) {
      command = arg;
    } else if (!target) {
      target = arg;
    }
  }

  return { command, target, flags };
}

function main(): void {
  const { command, target, flags } = parseArgs(process.argv);

  if (flags.help || flags.h || command === "help") {
    printHelp();
    process.exit(0);
  }

  if (flags.version || flags.v) {
    process.stdout.write(`kekkai v${VERSION}\n`);
    process.exit(0);
  }

  let exitCode = 0;

  switch (command) {
    case "scan":
      if (!target) {
        process.stderr.write("Error: path required. Usage: kekkai scan <path>\n");
        process.exit(1);
      }
      exitCode = scanCommand(target, {
        format: (flags.format as "text" | "json" | "sarif" | "markdown") ?? "text",
        severity: flags.severity as Severity | undefined,
        config: flags.config as string | undefined,
      });
      break;

    case "watch":
      if (!target) {
        process.stderr.write("Error: path required. Usage: kekkai watch <path>\n");
        process.exit(1);
      }
      watchCommand(target, {
        webhook: flags.webhook as string | undefined,
        config: flags.config as string | undefined,
      });
      break;

    case "audit":
      if (!target) {
        process.stderr.write("Error: path required. Usage: kekkai audit <path>\n");
        process.exit(1);
      }
      exitCode = auditCommand(target, {
        format: (flags.format as "text" | "json" | "markdown") ?? "text",
        ci: flags.ci === true,
        config: flags.config as string | undefined,
      });
      break;

    case "diff":
      if (!target) {
        process.stderr.write("Error: path required. Usage: kekkai diff <path>\n");
        process.exit(1);
      }
      exitCode = diffCommand(target, {
        since: flags.since as string | undefined,
        format: (flags.format as "text" | "json") ?? "text",
        config: flags.config as string | undefined,
      });
      break;

    case "quarantine":
      if (!target) {
        process.stderr.write("Error: path required. Usage: kekkai quarantine <path>\n");
        process.exit(1);
      }
      {
        let action: "isolate" | "list" | "restore" = "isolate";
        if (flags.list === true) action = "list";
        if (flags.restore === true) action = "restore";

        exitCode = quarantineCommand(target, {
          action,
          file: flags.file as string | undefined,
          line: flags.line ? parseInt(flags.line as string, 10) : undefined,
          id: flags.id as string | undefined,
          config: flags.config as string | undefined,
        });
      }
      break;

    case "init":
      exitCode = initCommand();
      break;

    default:
      if (command) {
        process.stderr.write(`Unknown command: ${command}\n\n`);
      }
      printHelp();
      exitCode = command ? 1 : 0;
      break;
  }

  process.exit(exitCode);
}

main();
