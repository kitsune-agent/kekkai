import { describe, it, expect } from "vitest";
import { getCredentialRules } from "../../src/engine/credentials.js";
import { scanContent } from "../../src/engine/scanner.js";

const rules = getCredentialRules();

function scan(text: string) {
  return scanContent(text, "test.md", rules);
}

describe("Credential Exposure Detection", () => {
  it("detects OpenAI API key", () => {
    const findings = scan("key: sk-1234567890abcdefghijklmnopqrst");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe("credential-exposure");
  });

  it("detects GitHub PAT", () => {
    const findings = scan("token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects GitHub OAuth token", () => {
    const findings = scan("gho_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects AWS access key", () => {
    const findings = scan("AKIAIOSFODNN7EXAMPLE");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects Stripe secret key", () => {
    const findings = scan("sk_" + "live_TESTKEYTESTKEYTESTKEYTEST");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects Slack token", () => {
    const findings = scan("xoxb-1234567890-abcdefghijkl");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects Google API key", () => {
    const findings = scan("AIzaSyA1234567890abcdefghijklmnopqrstuvw");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects private key header", () => {
    const findings = scan("-----BEGIN RSA PRIVATE KEY-----");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects EC private key header", () => {
    const findings = scan("-----BEGIN EC PRIVATE KEY-----");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects Bearer token", () => {
    const findings = scan("Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.data");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects password assignment", () => {
    const findings = scan('password = "supersecretpassword123"');
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects api_key assignment", () => {
    const findings = scan('api_key = "my-secret-api-key-value"');
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects database connection string", () => {
    const findings = scan("postgres://admin:password123@db.example.com:5432/mydb");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects Anthropic API key", () => {
    const findings = scan("sk-ant-abcdefghijklmnopqrstuvwx");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects npm token", () => {
    const findings = scan("npm_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects SendGrid key", () => {
    const findings = scan("SG.abcdefghijklmnopqrstuv.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrs");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("redacts credentials in context", () => {
    const findings = scan("my key is sk-1234567890abcdefghijklmnopqrst");
    expect(findings[0].context).toContain("[REDACTED]");
    expect(findings[0].context).not.toContain("sk-1234567890");
  });

  it("does not flag short strings as keys", () => {
    const findings = scan("sk-short");
    expect(findings.length).toBe(0);
  });

  it("does not flag the word 'password' alone", () => {
    const findings = scan("Please reset your password");
    expect(findings.length).toBe(0);
  });
});
