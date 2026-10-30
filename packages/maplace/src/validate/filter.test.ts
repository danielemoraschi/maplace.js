import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { filterFrom } from "./filter";

const filter = child(root("setFilter"), "filter");

describe("filterFrom", () => {
  it("makes a list groups, and leaves out what asks for nothing", () => {
    expect(filterFrom(["North"], filter)).toEqual({ groups: ["North"] });
    expect(filterFrom({ tags: ["parking"] }, filter)).toEqual({ tags: ["parking"] });
    expect(filterFrom({ groups: [], tags: [] }, filter)).toEqual({ groups: [] });
    expect(filterFrom({ tags: [] }, filter)).toBeUndefined();
    expect(filterFrom({}, filter)).toBeUndefined();
    expect(filterFrom(undefined, filter)).toBeUndefined();
  });

  it("accepts a list of groups, an object of groups and tags, or undefined", () => {
    expect(() => filterFrom(["North", "Centre"], filter)).not.toThrow();
    expect(() => filterFrom([], filter)).not.toThrow();
    expect(() => filterFrom({ groups: ["North"], tags: ["parking"] }, filter)).not.toThrow();
    expect(() => filterFrom({ tags: [] }, filter)).not.toThrow();
    expect(() => filterFrom(undefined, filter)).not.toThrow();
  });

  it("rejects something that is neither a list nor an object", () => {
    expect(() => filterFrom("North" as never, filter)).toThrow(
      /^setFilter: filter must be a list of groups, or an object of groups and tags, got "North"$/,
    );
    expect(() => filterFrom(null as never, filter)).toThrow(/^setFilter: filter must be /);
  });

  it("names a group that is not a string", () => {
    expect(() => filterFrom(["North", 2] as never, filter)).toThrow(
      /filter\[1\] must be a string, got 2/,
    );
    expect(() => filterFrom({ groups: [2] } as never, filter)).toThrow(
      /filter\.groups\[0\] must be a string, got 2/,
    );
  });

  it("names a bad tag", () => {
    expect(() => filterFrom({ tags: "parking" } as never, filter)).toThrow(
      /filter\.tags must be an array of tags, got "parking"/,
    );
    expect(() => filterFrom({ tags: ["parking", 2] } as never, filter)).toThrow(
      /filter\.tags\[1\] must be a string, got 2/,
    );
  });

  it("rejects an unknown key, which would otherwise show everything", () => {
    expect(() => filterFrom({ tag: ["parking"] } as never, filter)).toThrow(
      /filter\.tag is not a filter field/,
    );
  });
});
