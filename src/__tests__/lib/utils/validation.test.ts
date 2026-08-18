import { describe, it, expect } from "vitest";
import { contactInfoSchema, newAddressSchema } from "@/lib/utils/validation";

describe("contactInfoSchema", () => {
  it("accepts valid contact data", () => {
    const result = contactInfoSchema.safeParse({
      fullName: "Juan Pérez",
      email: "juan@example.com",
      phone: "3001234567",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name and returns error for fullName field", () => {
    const result = contactInfoSchema.safeParse({
      fullName: "",
      email: "juan@example.com",
      phone: "3001234567",
    });
    expect(result.success).toBe(false);
    // Zod v3: .error.errors — Zod v4: .error.issues; support both
    const issues = !result.success
      ? (result.error.issues ?? result.error.errors ?? [])
      : [];
    const hasFullNameError = issues.some((e) => e.path.includes("fullName"));
    expect(hasFullNameError).toBe(true);
  });

  it("rejects name shorter than 3 characters", () => {
    const result = contactInfoSchema.safeParse({
      fullName: "Al",
      email: "al@example.com",
      phone: "3001234567",
    });
    expect(result.success).toBe(false);
    const issues = !result.success
      ? (result.error.issues ?? result.error.errors ?? [])
      : [];
    const hasFullNameError = issues.some((e) => e.path.includes("fullName"));
    expect(hasFullNameError).toBe(true);
  });

  it("rejects invalid email format", () => {
    const invalidEmails = ["notanemail", "missing@", "@nodomain.com", "a@b"];
    for (const email of invalidEmails) {
      const result = contactInfoSchema.safeParse({
        fullName: "Juan Pérez",
        email,
        phone: "3001234567",
      });
      expect(result.success, `Expected '${email}' to be invalid`).toBe(false);
    }
  });

  it("accepts valid email formats", () => {
    const validEmails = ["juan@example.com", "test+tag@domain.co", "user@sub.domain.org"];
    for (const email of validEmails) {
      const result = contactInfoSchema.safeParse({
        fullName: "Juan Pérez",
        email,
        phone: "3001234567",
      });
      expect(result.success, `Expected '${email}' to be valid`).toBe(true);
    }
  });

  it("rejects phone with non-numeric characters", () => {
    const result = contactInfoSchema.safeParse({
      fullName: "Juan Pérez",
      email: "juan@example.com",
      phone: "300-123-4567",
    });
    expect(result.success).toBe(false);
    const issues = !result.success
      ? (result.error.issues ?? result.error.errors ?? [])
      : [];
    const hasPhoneError = issues.some((e) => e.path.includes("phone"));
    expect(hasPhoneError).toBe(true);
  });

  it("rejects phone that is too short", () => {
    const result = contactInfoSchema.safeParse({
      fullName: "Juan Pérez",
      email: "juan@example.com",
      phone: "123456", // 6 digits — minimum is 7
    });
    expect(result.success).toBe(false);
  });

  it("accepts Colombian mobile numbers", () => {
    const phones = ["3001234567", "3151234567", "3001234567890"];
    for (const phone of phones) {
      const result = contactInfoSchema.safeParse({
        fullName: "Juan Pérez",
        email: "juan@example.com",
        phone,
      });
      expect(result.success, `Expected phone '${phone}' to be valid`).toBe(true);
    }
  });
});

describe("newAddressSchema", () => {
  it("accepts valid address", () => {
    const result = newAddressSchema.safeParse({
      street: "Calle 10 # 20-30",
      city: "Medellín",
      state: "Antioquia",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short street", () => {
    const result = newAddressSchema.safeParse({
      street: "Cll",
      city: "Medellín",
      state: "Antioquia",
    });
    expect(result.success).toBe(false);
    const issues = !result.success
      ? (result.error.issues ?? result.error.errors ?? [])
      : [];
    const hasStreetError = issues.some((e) => e.path.includes("street"));
    expect(hasStreetError).toBe(true);
  });

  it("rejects empty city", () => {
    const result = newAddressSchema.safeParse({
      street: "Calle 10 # 20-30",
      city: "",
      state: "Antioquia",
    });
    expect(result.success).toBe(false);
    const issues = !result.success
      ? (result.error.issues ?? result.error.errors ?? [])
      : [];
    const hasCityError = issues.some((e) => e.path.includes("city"));
    expect(hasCityError).toBe(true);
  });

  it("makes postal_code optional", () => {
    const withPostal = newAddressSchema.safeParse({
      street: "Calle 10 # 20-30",
      city: "Medellín",
      state: "Antioquia",
      postal_code: "050001",
    });
    const withoutPostal = newAddressSchema.safeParse({
      street: "Calle 10 # 20-30",
      city: "Medellín",
      state: "Antioquia",
    });
    expect(withPostal.success).toBe(true);
    expect(withoutPostal.success).toBe(true);
  });
});
