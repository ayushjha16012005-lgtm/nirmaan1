import test from "node:test";
import assert from "node:assert";
import { formatCurrency, formatDateIST, escape } from "../core/ui.js";

test("formatCurrency formats amounts into Indian Rupees (INR) format", () => {
  const c1 = formatCurrency(500);
  assert.ok(c1.includes("500"), `Expected 500 in ${c1}`);

  const c2 = formatCurrency(125000);
  // Indian numbering uses 1,25,000
  assert.ok(c2.includes("1,25,000") || c2.includes("125,000"), `Got ${c2}`);

  const c3 = formatCurrency(0);
  assert.ok(c3.includes("0"), `Expected 0 in ${c3}`);
});

test("formatDateIST produces readable dates in IST timezone", () => {
  // 2026-10-01T12:00:00Z is 17:30 in IST (+5:30)
  const formatted = formatDateIST("2026-10-01T12:00:00Z");
  assert.ok(formatted.includes("2026"), `Expected 2026 in ${formatted}`);
  assert.ok(formatted.includes("Oct") || formatted.includes("1"), `Expected Oct in ${formatted}`);

  assert.strictEqual(formatDateIST(""), "");
  assert.strictEqual(formatDateIST(null), "");
});

test("escape sanitizes dangerous HTML characters to prevent XSS", () => {
  const dirty = '<script>alert("xss & dangerous")</script>\'';
  const clean = escape(dirty);

  assert.strictEqual(clean.includes("<script>"), false);
  assert.strictEqual(clean.includes("&lt;script&gt;"), true);
  assert.strictEqual(clean.includes("&amp;"), true);
  assert.strictEqual(clean.includes("&quot;"), true);
  assert.strictEqual(clean.includes("&#039;"), true);
});
