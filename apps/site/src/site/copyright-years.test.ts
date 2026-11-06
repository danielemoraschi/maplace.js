import { describe, expect, it } from "vitest";
import { copyrightYears } from "./copyright-years.ts";

describe("copyrightYears", () => {
  it("is 2026 alone in 2026, the year 1.0's code was written", () => {
    expect(copyrightYears(2026)).toBe("2026");
  });

  it("runs from 2026 to the year the site is built in, after it", () => {
    expect(copyrightYears(2028)).toBe("2026–2028");
  });
});
