import { describe, expect, it } from "vitest";
import { versionModule } from "./example-modules.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";

describe("versionModule", () => {
  it("has every section's vanilla and React module, to import when its version starts", () => {
    for (const { name } of EXAMPLE_SECTIONS) {
      expect(typeof versionModule(name, "vanilla")).toBe("function");
      expect(typeof versionModule(name, "react")).toBe("function");
    }
  });

  it("refuses a version that isn't there, naming its file", () => {
    expect(() => versionModule("nowhere", "react")).toThrow("examples/nowhere/react.tsx");
  });
});
