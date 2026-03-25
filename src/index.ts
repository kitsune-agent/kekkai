// kekkai — Memory integrity scanner for AI agents
// Library exports for programmatic use

export type {
  Severity,
  Category,
  Finding,
  ScanResult,
  AuditReport,
  FileScore,
  Rule,
  RuleMatch,
  Config,
  DiffEntry,
  QuarantineEntry,
} from "./types.js";

export { scanFile, scanContent, getAllRules } from "./engine/scanner.js";
export { getInjectionRules } from "./engine/injection.js";
export { getSmugglingRules } from "./engine/smuggling.js";
export { getCredentialRules } from "./engine/credentials.js";
export { getUnicodeRules } from "./engine/unicode.js";
export { getProvenanceRules } from "./engine/provenance.js";
export { defaultConfig, mergeConfig } from "./config.js";
export { toSarif, formatSarif } from "./formatters/sarif.js";
