import test from "node:test";
import assert from "node:assert";

// Phone validation logic used across auth & store
function validateIndianPhone(input) {
  if (!input || typeof input !== "string") return { valid: false, error: "Phone number required" };
  const cleaned = input.replace(/\D/g, "");
  
  // Accept 10 digits (without country code) or 12 digits starting with 91
  if (cleaned.length === 10) {
    if (!/^[6-9]/.test(cleaned)) {
      return { valid: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9" };
    }
    return { valid: true, e164: `+91${cleaned}` };
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const local = cleaned.slice(2);
    if (!/^[6-9]/.test(local)) {
      return { valid: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9" };
    }
    return { valid: true, e164: `+${cleaned}` };
  }

  return { valid: false, error: "Please enter a valid 10-digit Indian mobile number" };
}

function maskPhone(e164) {
  if (!e164 || e164.length < 10) return "+91 •••• ••••";
  const digits = e164.replace(/\D/g, "");
  const last2 = digits.slice(-2);
  const first2 = digits.slice(2, 4);
  return `+91 ${first2}•••• ••${last2}`;
}

function validateOTP(code) {
  if (!code || typeof code !== "string") return false;
  return /^\d{6}$/.test(code.trim());
}

test("Phone validation accepts standard 10-digit numbers starting with 6-9", () => {
  const r1 = validateIndianPhone("9876543210");
  assert.strictEqual(r1.valid, true);
  assert.strictEqual(r1.e164, "+919876543210");

  const r2 = validateIndianPhone("7012345678");
  assert.strictEqual(r2.valid, true);
  assert.strictEqual(r2.e164, "+917012345678");

  const r3 = validateIndianPhone("+91 88123 45678");
  assert.strictEqual(r3.valid, true);
  assert.strictEqual(r3.e164, "+918812345678");
});

test("Phone validation rejects invalid prefixes and incorrect lengths", () => {
  const r1 = validateIndianPhone("1234567890"); // Starts with 1
  assert.strictEqual(r1.valid, false);

  const r2 = validateIndianPhone("98765"); // Too short
  assert.strictEqual(r2.valid, false);

  const r3 = validateIndianPhone("98765432101234"); // Too long
  assert.strictEqual(r3.valid, false);

  const r4 = validateIndianPhone("");
  assert.strictEqual(r4.valid, false);
});

test("Phone masking preserves privacy with standard +91 XX•••• ••YY format", () => {
  const masked = maskPhone("+919876543210");
  assert.strictEqual(masked, "+91 98•••• ••10");
  assert.strictEqual(masked.includes("765432"), false);
});

test("OTP validation accepts only 6-digit numeric strings", () => {
  assert.strictEqual(validateOTP("123456"), true);
  assert.strictEqual(validateOTP("000000"), true);
  assert.strictEqual(validateOTP("984120"), true);

  assert.strictEqual(validateOTP("12345"), false); // 5 digits
  assert.strictEqual(validateOTP("1234567"), false); // 7 digits
  assert.strictEqual(validateOTP("12345A"), false); // Non-digit
  assert.strictEqual(validateOTP(""), false);
});
