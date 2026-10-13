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
      fitAllLabel: "All",
      label: "Shops",
      render: () => {},
    };
    expect(check(all)).not.toThrow();
  });

  it("refuses unknown options and bad values", () => {
    expect(check({ type: "list" })).toThrow("createListView: type is not a list view option");
    expect(check({ as: "dropdown" })).toThrow(/as must be one of/);
    expect(check({ label: "  " })).toThrow("createListView: label must be a non-blank string");
  });

  it("refuses render for a native select instead of ignoring it", () => {
    expect(check({ as: "select", render: () => {} })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringContaining("render needs as: 'list'"),
      }),
    );
  });
});
