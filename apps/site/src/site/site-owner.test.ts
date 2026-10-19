import { describe, expect, it } from "vitest";
import { contactAddress, PRIVACY_CONTACT_EMAIL } from "./site-owner.ts";

describe("contactAddress", () => {
  it("gives an address back as it is", () => {
    expect(contactAddress("someone@example.org")).toBe("someone@example.org");
  });

  it.each(["", "someone", "someone@", "@example.org", "some one@example.org", "someone@example"])(
    "refuses %j, so a privacy page never ships without a way to reach its owner",
    (value) => {
      expect(() => contactAddress(value)).toThrow(/PRIVACY_CONTACT_EMAIL/);
    },
  );

  it("accepts the address the privacy page gives", () => {
    expect(contactAddress(PRIVACY_CONTACT_EMAIL)).toBe(PRIVACY_CONTACT_EMAIL);
  });
});
