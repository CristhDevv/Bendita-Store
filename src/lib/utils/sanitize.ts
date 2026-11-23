/**
 * Sanitize & Security Utilities
 *
 * Prevents HTML Injection, XSS, and parameter pollution in emails,
 * logs, and server-rendered HTML blocks.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escapes characters that have special meaning in HTML contexts.
 * Safe for inserting user-provided strings into HTML email templates and messages.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) {
    return "";
  }
  const str = String(input);
  return str.replace(/[&<>"'/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Sanitizes plain text input by stripping control characters and trimming.
 */
export function sanitizePlainText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  // Strip NULL bytes and non-printable control characters except newline and tab
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}
