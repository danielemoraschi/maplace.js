import { describe, expect, it } from "vitest";
import { versionModule } from "./example-modules.ts";
import { exampleFolder } from "./example-providers.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { exampleProviders } from "./example-sources.ts";

describe("versionModule", () => {
  it("has every section's vanilla and React module, to import when its version starts", () => {
    for (const { name } of EXAMPLE_SECTIONS) {
      expect(typeof versionModule(name, "vanilla")).toBe("function");
      expect(typeof versionModule(name, "react")).toBe("function");
    }
  });

  it("has every MapLibre section's vanilla and React module", () => {
    const onMapLibre = EXAMPLE_SECTIONS.filter(({ name }) =>
      exampleProviders(name).includes("maplibre"),
    );
    expect(onMapLibre.length).toBeGreaterThan(0);
    for (const { name } of onMapLibre) {
      const folder = exampleFolder(name, "maplibre");
      expect(typeof versionModule(folder, "vanilla")).toBe("function");
      expect(typeof versionModule(folder, "react")).toBe("function");
    }
  });

  it("refuses a version that isn't there, naming its file", () => {
    expect(() => versionModule("nowhere", "react")).toThrow("examples/nowhere/react.tsx");
    expect(() => versionModule("route/maplibre", "vanilla")).toThrow(
      "examples/route/maplibre/vanilla.ts",
    );
  });
});
