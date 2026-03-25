# kekkai (結界)

Memory integrity scanner for AI agents. Deterministic, AI-free defense against [OWASP ASI06](https://genai.owasp.org/) memory poisoning.

> **結界** (*kekkai*) — a barrier or protective ward in Japanese. Kekkai scans your agent's memory files for injection, smuggling, credential leaks, and provenance gaps before they become breaches.

Part of the **kitsune-agent** governance stack.

## Why

AI agents persist memory in markdown, JSON, and YAML files. These files are attack surfaces:

- **Prompt injection** — "ignore previous instructions" planted in memory
- **Instruction smuggling** — hidden directives embedded in data fields
- **Credential exposure** — API keys, tokens, and secrets accidentally stored
- **Unicode attacks** — zero-width characters and homoglyphs for invisible manipulation
- **Provenance gaps** — memory entries with no source attribution or trust markers

Kekkai detects all of these with **zero AI** — pure pattern matching, deterministic results, no API calls, no tokens consumed.

## Install

```sh
npm install -g kekkai
```

Requires Node.js 18+. Zero runtime dependencies.

## Quick Start

```sh
# Scan a memory directory
kekkai scan ./memory/

# Get a full audit report
kekkai audit ./memory/ --format markdown

# Watch for real-time changes
kekkai watch ./memory/

# Initialize config
kekkai init
```

## Commands

### `kekkai scan <path>`

Scan files or directories for threats.

```sh
kekkai scan ./memory/
kekkai scan ./memory/ --format json
kekkai scan ./memory/ --format sarif
kekkai scan ./memory/ --severity critical
```

Options:
- `--format` — `text` (default), `json`, `sarif`, `markdown`
- `--severity` — Filter by minimum severity: `critical`, `high`, `medium`, `low`, `info`
- `--config` — Path to config file

Exit code 1 if any findings, 0 if clean.

### `kekkai watch <path>`

Real-time file monitoring with `fs.watch`.

```sh
kekkai watch ./memory/
kekkai watch ./memory/ --webhook https://hooks.slack.com/...
```

Outputs newline-delimited JSON for piping. Sends findings to a webhook URL if configured.

### `kekkai audit <path>`

Full integrity report with per-file trust scores (0–100).

```sh
kekkai audit ./memory/
kekkai audit ./memory/ --format json
kekkai audit ./memory/ --ci
```

Options:
- `--format` — `text` (default), `json`, `markdown`
- `--ci` — Exit non-zero if any critical or high findings (for CI pipelines)

### `kekkai diff <path>`

Compare memory state across git commits to detect gradual poisoning.

```sh
kekkai diff ./memory/
kekkai diff ./memory/ --since HEAD~20
kekkai diff ./memory/ --format json
```

### `kekkai quarantine <path>`

Isolate suspicious entries for human review.

```sh
# Quarantine all flagged lines in a file
kekkai quarantine . --file ./memory/suspicious.md

# Quarantine a specific line
kekkai quarantine . --file ./memory/entry.md --line 42

# List quarantined entries
kekkai quarantine . --list

# Restore a quarantined entry
kekkai quarantine . --restore --id abc12345
```

Quarantined content is moved to `.kekkai-quarantine/` with a placeholder left in the original file.

### `kekkai init`

Create a `.kekkairc.json` config file with defaults.

```sh
kekkai init
```

## Detection Patterns

### Prompt Injection (Critical)

Detects attempts to override agent instructions:

- "ignore previous instructions" / "ignore all prior"
- "you are now" / "pretend you are" / "act as"
- "system:" prefix in data files
- "IMPORTANT:" with override keywords
- "do not tell the user"
- Hidden instructions in HTML comments
- Hidden instructions after excessive whitespace
- DAN-style jailbreak patterns
- "disregard" / "forget everything"

### Instruction Smuggling (High)

Detects covert directives in data fields:

- "remember to always" / "from now on" directives
- Conditional triggers ("when the user asks about X, respond with Y")
- Role reassignment patterns
- "never reveal" / "secret instruction"
- Behavior override commands

### Credential Exposure (Critical)

Detects 25+ secret patterns:

- OpenAI, Anthropic, Google API keys
- GitHub PATs and OAuth tokens
- AWS access keys and secrets
- Stripe, Slack, SendGrid, Twilio tokens
- Private key headers (RSA, EC, DSA, OPENSSH)
- Bearer tokens
- Database connection strings with credentials
- Generic password/secret/token assignments

Credentials are automatically redacted in output.

### Unicode Attacks (High)

Detects invisible manipulation:

- Zero-width characters (U+200B, U+200C, U+200D, U+FEFF, U+2060)
- Invisible separators and operators
- Bidirectional text overrides (RTL/LTR)
- Homoglyph substitution (Cyrillic → Latin lookalikes)

### Provenance Gaps (Medium)

Detects trust chain breaks:

- Memory entries without `[source: ...]` tags
- External content without trust level markers
- Bare URLs without context
- Future dates (temporal anomalies)

## Output Formats

| Format | Flag | Use Case |
|--------|------|----------|
| Text | `--format text` | Human-readable terminal output |
| JSON | `--format json` | Piping to other tools |
| SARIF | `--format sarif` | GitHub Code Scanning integration |
| Markdown | `--format markdown` | Reports and documentation |

### GitHub Code Scanning

```sh
kekkai scan ./memory/ --format sarif > results.sarif
# Upload to GitHub Code Scanning via API
```

## Configuration

Create `.kekkairc.json` with `kekkai init` or manually:

```json
{
  "rules": {
    "prompt-injection": { "enabled": true, "severity": "critical" },
    "instruction-smuggling": { "enabled": true, "severity": "high" },
    "credential-exposure": { "enabled": true, "severity": "critical" },
    "unicode-attacks": { "enabled": true, "severity": "high" },
    "provenance-gaps": { "enabled": true, "severity": "medium" }
  },
  "allowList": [],
  "fileTypes": [".md", ".jsonl", ".json", ".txt", ".yaml", ".yml"],
  "exclude": ["node_modules", ".git", ".kekkai-quarantine"],
  "watchWebhook": null,
  "trustThreshold": 50
}
```

### Allow List

Suppress known-safe patterns:

```json
{
  "allowList": [
    "ignore previous",
    "injection-ignore-previous"
  ]
}
```

Patterns match against both line content and rule IDs.

## Programmatic API

```typescript
import { scanFile, scanContent, getAllRules, formatSarif } from "kekkai";

// Scan a string
const result = scanFile(content, "memory.md");

// Get all rules
const rules = getAllRules();

// Scan with custom rules
const findings = scanContent(content, "file.md", rules, ["allow-pattern"]);

// Generate SARIF
const sarif = formatSarif([result]);
```

## Philosophy

Kekkai is **AI-free by design**. Every detection is a deterministic pattern match — no LLM calls, no embeddings, no heuristics that change between runs. This means:

- **Reproducible** — same input, same output, every time
- **Fast** — sub-100ms for typical memory directories
- **Auditable** — every rule is readable regex, no black boxes
- **Offline** — works without network access
- **Zero dependencies** — nothing to supply-chain attack

## License

MIT
