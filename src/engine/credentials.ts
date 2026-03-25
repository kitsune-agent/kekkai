import type { Rule, RuleMatch } from "../types.js";

const credentialPatterns: Array<{
  id: string;
  description: string;
  pattern: RegExp;
}> = [
  // OpenAI
  { id: "cred-openai-key", description: "OpenAI API key", pattern: /sk-[a-zA-Z0-9]{20,}/ },
  // GitHub
  { id: "cred-github-pat", description: "GitHub personal access token", pattern: /ghp_[a-zA-Z0-9]{36}/ },
  { id: "cred-github-oauth", description: "GitHub OAuth token", pattern: /gho_[a-zA-Z0-9]{36}/ },
  { id: "cred-github-app", description: "GitHub App token", pattern: /ghu_[a-zA-Z0-9]{36}/ },
  { id: "cred-github-refresh", description: "GitHub refresh token", pattern: /ghr_[a-zA-Z0-9]{36}/ },
  // AWS
  { id: "cred-aws-access-key", description: "AWS access key ID", pattern: /AKIA[0-9A-Z]{16}/ },
  { id: "cred-aws-secret", description: "AWS secret access key", pattern: /aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{40}/i },
  // Stripe
  { id: "cred-stripe-secret", description: "Stripe secret key", pattern: /sk_live_[a-zA-Z0-9]{24,}/ },
  { id: "cred-stripe-restricted", description: "Stripe restricted key", pattern: /rk_live_[a-zA-Z0-9]{24,}/ },
  // Slack
  { id: "cred-slack-token", description: "Slack token", pattern: /xox[bpors]-[a-zA-Z0-9-]{10,}/ },
  { id: "cred-slack-webhook", description: "Slack webhook URL", pattern: /hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,}\/B[a-zA-Z0-9_]{8,}\/[a-zA-Z0-9_]{24}/ },
  // Google
  { id: "cred-google-api", description: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { id: "cred-google-oauth", description: "Google OAuth client secret", pattern: /GOCSPX-[a-zA-Z0-9_-]{28}/ },
  // Private keys
  { id: "cred-private-key", description: "Private key header", pattern: /-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/ },
  // Bearer tokens
  { id: "cred-bearer-token", description: "Bearer token in text", pattern: /Bearer\s+[a-zA-Z0-9._\-]{20,}/i },
  // Generic patterns
  { id: "cred-password-assign", description: "Password assignment", pattern: /password\s*[=:]\s*["'][^"']{8,}["']/i },
  { id: "cred-api-key-assign", description: "API key assignment", pattern: /api[_-]?key\s*[=:]\s*["'][^"']{8,}["']/i },
  { id: "cred-secret-assign", description: "Secret assignment", pattern: /secret\s*[=:]\s*["'][^"']{8,}["']/i },
  { id: "cred-token-assign", description: "Token assignment", pattern: /token\s*[=:]\s*["'][a-zA-Z0-9._\-]{20,}["']/i },
  // Database connection strings
  { id: "cred-db-connection", description: "Database connection string with credentials", pattern: /(mongodb|postgres|mysql|redis):\/\/[^:\s]+:[^@\s]+@/i },
  // Heroku
  { id: "cred-heroku-api", description: "Heroku API key", pattern: /heroku.*[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i },
  // Twilio
  { id: "cred-twilio-key", description: "Twilio API key", pattern: /SK[a-f0-9]{32}/ },
  // SendGrid
  { id: "cred-sendgrid-key", description: "SendGrid API key", pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/ },
  // Anthropic
  { id: "cred-anthropic-key", description: "Anthropic API key", pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/ },
  // npm
  { id: "cred-npm-token", description: "npm token", pattern: /npm_[a-zA-Z0-9]{36}/ },
  // Mailgun
  { id: "cred-mailgun-key", description: "Mailgun API key", pattern: /key-[a-f0-9]{32}/ },
];

export function getCredentialRules(): Rule[] {
  return credentialPatterns.map(({ id, description, pattern }) => ({
    id,
    category: "credential-exposure" as const,
    severity: "critical" as const,
    description,
    test(line: string, _lineNumber: number, _fullContent: string, _filePath: string): RuleMatch[] {
      const match = pattern.exec(line);
      if (!match) return [];
      // Mask the actual credential in context
      const masked = line.trim().slice(0, 200).replace(pattern, "[REDACTED]");
      return [
        {
          column: match.index + 1,
          context: masked,
          pattern: match[0].slice(0, 10) + "...",
        },
      ];
    },
  }));
}
