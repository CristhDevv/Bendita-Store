import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils/format";

describe("formatPrice", () => {
  it("formats numbers with thousand separators using dots", () => {
    expect(formatPrice(1000)).toBe("1.000");
    expect(formatPrice(10000)).toBe("10.000");
    expect(formatPrice(1000000)).toBe("1.000.000");
  });

  it("leaves numbers under 1000 unchanged", () => {
    expect(formatPrice(0)).toBe("0");
    expect(formatPrice(1)).toBe("1");
    expect(formatPrice(999)).toBe("999");
  });

  it("handles exact boundary values", () => {
    expect(formatPrice(1000)).toBe("1.000");
    expect(formatPrice(999999)).toBe("999.999");
  });

  it("handles large Colombian peso amounts", () => {
    expect(formatPrice(350000)).toBe("350.000");
    expect(formatPrice(1500000)).toBe("1.500.000");
    expect(formatPrice(12500000)).toBe("12.500.000");
  });
});
