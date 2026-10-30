import { describe, expect, it } from "vitest";
import { root } from "../validate/fail";
import { checkListViewOptions } from "./options";

const field = root("createListView");
const check = (value: unknown) => () => checkListViewOptions(value, field);

describe("checkListViewOptions", () => {
  it("accepts every option, or none", () => {
    expect(check(undefined)).not.toThrow();
    const all = {
      as: "list",
      groupHeadings: true,
      groupCounts: true,
      fitAllLabel: "All",
      label: "Shops",
      heading: "Choose a location:",
      render: () => {},
      scope: "viewport",
      areaOnlyLabel: "Here only",
      showAllLabel: "Everything",
      emptyAreaLabel: "Nothing here",
    };
    expect(check(all)).not.toThrow();
  });

  it("refuses a groupCounts that isn't a boolean", () => {
    expect(check({ groupCounts: "yes" })).toThrow(/groupCounts must be/);
  });

  it("refuses groupCounts with groupHeadings false, and takes it otherwise", () => {
    expect(check({ groupCounts: true, groupHeadings: false })).toThrow(
      "createListView: groupCounts needs group headings",
    );
    expect(check({ groupCounts: true, groupHeadings: true })).not.toThrow();
    expect(check({ groupCounts: true })).not.toThrow();
    expect(check({ groupCounts: false, groupHeadings: false })).not.toThrow();
  });

  it("refuses unknown options and bad values", () => {
    expect(check({ type: "list" })).toThrow("createListView: type is not a list view option");
    expect(check({ as: "dropdown" })).toThrow(/as must be one of/);
    expect(check({ label: "  " })).toThrow("createListView: label must be a non-blank string");
    expect(check({ heading: " " })).toThrow("createListView: heading must be a non-blank string");
    expect(check({ heading: 3 })).toThrow(/heading must be a non-blank string/);
    expect(check({ scope: "world" })).toThrow(/scope must be one of/);
    expect(check({ areaOnlyLabel: " " })).toThrow(/areaOnlyLabel must be a non-blank string/);
    expect(check({ emptyAreaLabel: "" })).toThrow(/emptyAreaLabel must be a non-blank string/);
    expect(check({ showAllLabel: 1 })).toThrow(/showAllLabel must be a non-blank string/);
  });

  it("refuses render for a native select instead of ignoring it", () => {
    expect(check({ as: "select", render: () => {} })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringContaining("render needs as: 'list'"),
      }),
    );
  });

  it("refuses scope for a native select instead of ignoring it", () => {
    expect(check({ as: "select", scope: "viewport" })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringContaining("scope needs as: 'list'"),
      }),
    );
  });
});
