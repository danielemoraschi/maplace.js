import { describe, expect, it } from "vitest";
import { MaplaceError } from "./errors";

describe("MaplaceError", () => {
  it("is an Error with a code, the location and the field", () => {
    const error = new MaplaceError("invalid-input", 'location "a": lat must be a number', {
      locationId: "a",
      field: "lat",
    });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "MaplaceError",
      code: "invalid-input",
      message: 'location "a": lat must be a number',
      locationId: "a",
      field: "lat",
    });
  });

  it("leaves location and field undefined when not given", () => {
    const error = new MaplaceError("destroyed", "the store was destroyed");
    expect(error.locationId).toBeUndefined();
    expect(error.field).toBeUndefined();
  });

  it("has no cause property when none is given, like a native error", () => {
    expect("cause" in new MaplaceError("destroyed", "the store was destroyed")).toBe(false);
  });

  it("keeps the cause", () => {
    const cause = new Error("network");
    expect(new MaplaceError("provider-load-failed", "load failed", { cause }).cause).toBe(cause);
  });
});
