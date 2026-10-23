import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { refusedKeysCheck } from "./refused-keys";

describe("refusedKeysCheck", () => {
  const field = child(root("caller"), "settings");
  const check = refusedKeysCheck({ a: "goes in A", b: "goes in B" }, "a JSON object");

  it.each([
    ["a", "goes in A"],
    ["b", "goes in B"],
  ])("refuses %s in the caller's own words", (key, remark) => {
    expect(() => check({ [key]: 1 }, field)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: `settings.${key}`,
        message: `caller: settings.${key} ${remark}`,
      }),
    );
  });

  it("names what the caller expects instead of a non-object", () => {
    expect(() => check([1], field)).toThrow(
      expect.objectContaining({ message: "caller: settings must be a JSON object, got an array" }),
    );
  });
});
