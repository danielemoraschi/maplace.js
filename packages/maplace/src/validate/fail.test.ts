import { describe, expect, it } from "vitest";
import { child, describeValue, item, reject, root } from "./fail";

describe("reject", () => {
  it("names the subject and the field path, and carries both on the error", () => {
    const field = item(child(root('location "p"', "p"), "path"), 2);
    expect(() => reject(child(field, "lng"), "must be a number")).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: 'location "p": path[2].lng must be a number',
        locationId: "p",
        field: "path[2].lng",
      }),
    );
  });

  it("speaks about the subject itself when there is no field", () => {
    expect(() => reject(root("locations[3]"), "must be an object")).toThrow(
      expect.objectContaining({ message: "locations[3]: must be an object", field: undefined }),
    );
  });

  it("throws another misuse code when given one", () => {
    expect(() =>
      reject(child(root("x"), "html"), "needs the sanitize option", "missing-sanitizer"),
    ).toThrow(expect.objectContaining({ code: "missing-sanitizer" }));
  });
});

describe("describeValue", () => {
  it("quotes strings, so a numeric string is visible as one", () => {
    expect(describeValue("45.1")).toBe('"45.1"');
  });

  it("prints numbers and absences as they are", () => {
    expect(describeValue(95)).toBe("95");
    expect(describeValue(Number.NaN)).toBe("NaN");
    expect(describeValue(undefined)).toBe("undefined");
    expect(describeValue(null)).toBe("null");
  });

  it("names the kind of anything else", () => {
    expect(describeValue(() => 1)).toBe("a function");
    expect(describeValue([1])).toBe("an array");
    expect(describeValue({})).toBe("an object");
  });

  it("shortens long strings", () => {
    expect(describeValue("x".repeat(100))).toBe(`"${"x".repeat(40)}…"`);
  });
});
