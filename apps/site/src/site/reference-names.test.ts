import { describe, expect, it } from "vitest";
import { everyName, LOCATION_FIELDS } from "./reference-names.ts";

describe("everyName", () => {
  it("gives the names in the order written", () => {
    expect(everyName<"b" | "a">({ b: true, a: true })).toEqual(["b", "a"]);
  });
});

describe("LOCATION_FIELDS", () => {
  it("gives each type only the fields the others lack", () => {
    expect(LOCATION_FIELDS.common).toContain("id");
    expect(LOCATION_FIELDS.common).not.toContain("icon");
    expect(LOCATION_FIELDS.marker).toContain("icon");
    expect(LOCATION_FIELDS.marker).not.toContain("id");
  });
});
