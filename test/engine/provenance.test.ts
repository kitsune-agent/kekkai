import { describe, it, expect } from "vitest";
import { getProvenanceRules } from "../../src/engine/provenance.js";
import { scanContent } from "../../src/engine/scanner.js";

const rules = getProvenanceRules();

function scan(text: string, file = "test.md") {
  return scanContent(text, file, rules);
}

describe("Provenance Gap Detection", () => {
  describe("missing source attribution", () => {
    it("detects memory entry without source tag", () => {
      const content = "## Meeting Notes\n\nSome content without source.";
      const findings = scan(content);
      expect(findings.some((f) => f.rule === "provenance-no-source")).toBe(true);
    });

    it("does not flag entry with [source: ...] tag", () => {
      const content = "## Meeting Notes\n[source: team-meeting]\n\nContent.";
      const findings = scan(content);
      expect(findings.some((f) => f.rule === "provenance-no-source")).toBe(false);
    });

    it("does not flag entry with source: key nearby", () => {
      const content = "## Entry\nsource: manual-input\n\nContent.";
      const findings = scan(content);
      expect(findings.some((f) => f.rule === "provenance-no-source")).toBe(false);
    });

    it("only checks markdown files", () => {
      const content = "## Entry Without Source\n\nContent.";
      const findings = scan(content, "test.json");
      expect(findings.some((f) => f.rule === "provenance-no-source")).toBe(false);
    });
  });

  describe("external content without trust level", () => {
    it("detects email data source without trust marker", () => {
      const findings = scan("Data imported from email source");
      expect(findings.some((f) => f.rule === "provenance-external-no-trust")).toBe(true);
    });

    it("detects webhook data reference without trust marker", () => {
      const findings = scan("Received via webhook");
      expect(findings.some((f) => f.rule === "provenance-external-no-trust")).toBe(true);
    });

    it("detects imported from pattern", () => {
      const findings = scan("imported from external system");
      expect(findings.some((f) => f.rule === "provenance-external-no-trust")).toBe(true);
    });

    it("does not flag external with trust level", () => {
      const findings = scan("Email data source, trust_level: verified");
      expect(findings.some((f) => f.rule === "provenance-external-no-trust")).toBe(false);
    });

    it("does not flag external marked as unverified", () => {
      const findings = scan("Webhook content (unverified)");
      expect(findings.some((f) => f.rule === "provenance-external-no-trust")).toBe(false);
    });
  });

  describe("bare URLs", () => {
    it("detects bare URL without context", () => {
      const findings = scan("https://example.com/suspicious-endpoint");
      expect(findings.some((f) => f.rule === "provenance-bare-url")).toBe(true);
    });

    it("does not flag markdown links", () => {
      const findings = scan("[Click here](https://example.com/page)");
      expect(findings.some((f) => f.rule === "provenance-bare-url")).toBe(false);
    });

    it("does not flag URLs with surrounding text", () => {
      const findings = scan("The documentation at https://docs.example.com/guide explains the architecture in detail and covers all endpoints");
      expect(findings.some((f) => f.rule === "provenance-bare-url")).toBe(false);
    });
  });

  describe("future dates", () => {
    it("detects future dates", () => {
      const findings = scan("Entry from 2099-12-31 about something");
      expect(findings.some((f) => f.rule === "provenance-future-date")).toBe(true);
    });

    it("does not flag past dates", () => {
      const findings = scan("Meeting on 2024-01-15");
      expect(findings.some((f) => f.rule === "provenance-future-date")).toBe(false);
    });

    it("does not flag today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      const findings = scan(`Entry from ${today}`);
      expect(findings.some((f) => f.rule === "provenance-future-date")).toBe(false);
    });
  });
});
