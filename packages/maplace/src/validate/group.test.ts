import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkGroup } from "./group";
import { validateLocation } from "./location";

const field = child(root("test"), "group");

describe("checkGroup", () => {
  it("takes a name or a path of 1–3 names", () => {
    for (const group of [
      "North",
      "",
      ["Europe"],
      ["Europe", "Italy"],
      ["Europe", "Italy", "Rome"],
    ]) {
      expect(() => checkGroup(group, field)).not.toThrow();
    }
  });

  it("refuses an empty path, 4 names, a blank or non-string name", () => {
    const path = "a group name, or a path of 1 to 3 names";
    expect(() => checkGroup([], field)).toThrow(`test: group must be ${path}, got an array`);
    expect(() => checkGroup(["a", "b", "c", "d"], field)).toThrow(`group must be ${path}`);
    expect(() => checkGroup(7, field)).toThrow(`group must be ${path}, got 7`);
    expect(() => checkGroup(["Europe", " "], field)).toThrow(
      'group[1] must be a non-blank string, got " "',
    );
    expect(() => checkGroup(["Europe", 2], field)).toThrow("group[1] must be a non-blank string");
  });
});

describe("a location's group", () => {
  it("names the location and its group field", () => {
    const at = { index: 0, sanitize: undefined };
    const office = (group: unknown) => () =>
      validateLocation({ id: "m", lat: 0, lng: 0, group }, at);
    expect(office(["Europe", "Italy"])).not.toThrow();
    expect(office(["Europe", 2])).toThrow(
      /location "m": group\[1\] must be a non-blank string, got 2/,
    );
  });
});
