import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";

describe("Sanitize Utilities", () => {
  describe("escapeHtml", () => {
    it("escapes dangerous HTML characters", () => {
      const dangerous = `<script>alert("xss & 'pwned'")</script>/`;
      const escaped = escapeHtml(dangerous);
      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;xss &amp; &#x27;pwned&#x27;&quot;)&lt;&#x2F;script&gt;&#x2F;"
      );
      expect(escaped).not.toContain("<script>");
      expect(escaped).not.toContain('"');
    });

    it("handles null, undefined and non-string inputs safely", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
      expect(escapeHtml(12345)).toBe("12345");
      expect(escapeHtml(true)).toBe("true");
    });

    it("does not alter safe strings", () => {
      const safe = "Juan Perez Gomez 100ml";
      expect(escapeHtml(safe)).toBe("Juan Perez Gomez 100ml");
    });
  });

  describe("sanitizePlainText", () => {
    it("strips null bytes and control characters", () => {
      const input = "Hello\x00World\x1F!";
      expect(sanitizePlainText(input)).toBe("HelloWorld!");
    });

    it("enforces max length constraints", () => {
      const input = "a".repeat(100);
      expect(sanitizePlainText(input, 10)).toHaveLength(10);
    });
  });
});
