import { describe, expect, it } from "vitest";
import { lastChangeOf } from "./git-dates.ts";
import { PRIVACY_SOURCES } from "./page-sources.ts";
import { PRIVACY_CHANGED_ON } from "./privacy-changed-on.ts";

describe("PRIVACY_CHANGED_ON", () => {
  it("is the day what the privacy page says last changed, committed or not", () => {
    const changed = lastChangeOf(PRIVACY_SOURCES);
    expect(
      PRIVACY_CHANGED_ON,
      `${PRIVACY_SOURCES.join(", ")} last changed on ${changed}: set PRIVACY_CHANGED_ON to it`,
    ).toBe(changed);
  });
});
