# kekkai (結界) — Memory Integrity Scanner for AI Agents

## Philosophy
AI-free, deterministic, zero-dependency CLI tool. Part of the kitsune-agent governance stack (kioku + bannin + yurei + inrou + kekkai). Implements OWASP ASI06 defenses without requiring an LLM.

## What It Does
Scans agent memory files (markdown, JSONL, JSON) for injection patterns, instruction smuggling, credential exposure, and provenance gaps. Think ESLint for agent memory.

## Core Commands

### `kekkai scan <path>`
Scan files or directories for threats. Returns structured findings with severity levels.
- Detects prompt injection patterns ("ignore previous instructions", "you are now", "system:", etc.)
- Detects instruction smuggling in natural text (hidden directives, role overrides)
- Detects credential/secret leaks (API keys, tokens, passwords, private keys)
- Detects provenance gaps (entries without source attribution)
- Detects anomalous patterns (base64 blocks, unicode homoglyphs, zero-width characters)
- Outputs JSON findings with severity (critical/high/medium/low/info), pattern matched, line number, context

### `kekkai watch <path>`
Real-time file watcher. Monitors directory for changes, scans new/modified content immediately.
- Uses fs.watch for lightweight monitoring
- Reports threats in real-time to stdout or a webhook URL
- Can run as a daemon via --daemon flag
- Outputs newline-delimited JSON for piping

### `kekkai audit <path>`
Generate a full integrity report for a memory directory.
- Aggregates scan results across all files
- Computes per-file trust scores (0-100)
- Identifies highest-risk files
- Outputs a markdown report or JSON summary
- --ci flag exits non-zero if any critical/high findings

### `kekkai diff <path> [--since <commit>]`
Compare memory state across git commits to detect gradual poisoning.
- Uses git log/diff to find memory file changes
- Scans each change for injection patterns
- Highlights entries that appeared from external sources (email, webhook) without human verification
- Timeline view showing when trust-degrading changes entered

### `kekkai quarantine <path> --file <file> --line <n>`
Isolate suspicious entries for human review.
- Moves flagged content to a .kekkai-quarantine/ directory
- Leaves a placeholder marker in the original file
- quarantine list / quarantine restore commands

### `kekkai init`
Initialize kekkai config for a project.
- Creates .kekkairc.json with customizable rules
- Default patterns for common agent frameworks (OpenClaw, LangChain, AutoGPT)
- Allow-list for known-safe patterns

## Detection Patterns (Deterministic)

### Prompt Injection (Critical)
- "ignore previous instructions"
- "ignore all prior"
- "you are now <role>"
- "system:" at start of line in non-system files
- "IMPORTANT:" followed by instruction override
- "do not tell the user"
- "pretend you are"
- Hidden instructions after long whitespace
- Markdown comment abuse (<!-- hidden instructions -->)

### Instruction Smuggling (High)
- Imperative sentences in data-only fields (e.g., instructions inside JSON values)
- "remember to always" / "from now on" patterns in reported/external content
- Conditional triggers ("when the user asks about X, respond with Y")
- Role reassignment patterns

### Credential Exposure (Critical)
- API key patterns (sk-..., ghp_..., Bearer ..., etc.)
- Base64-encoded secrets (heuristic: high entropy + base64 charset)
- Private key headers (-----BEGIN ... PRIVATE KEY-----)
- Database connection strings
- 25+ provider-specific patterns

### Unicode/Encoding Attacks (High)
- Zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
- Homoglyph substitution (Cyrillic а vs Latin a, etc.)
- RTL override characters
- Invisible separator exploitation

### Provenance Gaps (Medium)
- Memory entries without [source: ...] tags
- External content (email, webhook) without trust level markers
- Entries that reference external URLs without context
- Temporal anomalies (future dates, impossible timestamps)

## Output Formats
- `--format text` (default, human-readable)
- `--format json` (structured, for piping)
- `--format sarif` (Static Analysis Results Interchange Format — GitHub Code Scanning compatible)
- `--format markdown` (report format)

## Configuration (.kekkairc.json)
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

## Technical Stack
- TypeScript (strict mode)
- Zero runtime dependencies
- Node.js 18+
- Vitest for testing
- ESM-only

## Testing Requirements
- Unit tests for every detection pattern
- False positive tests (benign text that looks suspicious)
- Real-world memory file fixtures (OpenClaw-style markdown)
- Integration tests for watch mode, quarantine, and diff
- 80+ tests minimum

## Success Criteria
1. Detects all OWASP ASI06 example attack patterns
2. Zero false positives on clean OpenClaw memory files
3. Sub-100ms scan for typical memory directory (50 files)
4. SARIF output passes GitHub Code Scanning validation
5. Works as both CLI tool and importable library
