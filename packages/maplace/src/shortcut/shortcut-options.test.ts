import { describe, expect, it } from "vitest";
import { listAskedFor, listViewOptionsOf } from "./shortcut-options";

describe("listAskedFor", () => {
  it("takes true for the default list, with no options, and none for none", () => {
    expect(listAskedFor(true)).toEqual({});
    expect(listAskedFor(undefined)).toBeUndefined();
    const list = { heading: "Cities" };
    expect(listAskedFor(list)).toBe(list);
  });
});

describe("listViewOptionsOf", () => {
  it("gives the list view its own options, without where the list goes", () => {
    const list = { as: "select", position: "top-left", container: "#side" } as const;
    expect(listViewOptionsOf(list)).toEqual({ as: "select" });
  });
});
