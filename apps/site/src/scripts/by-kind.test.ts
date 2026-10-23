// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { byKind } from "./by-kind.ts";

function versionOfKind(kind: string): HTMLElement {
  document.body.innerHTML = `<div data-live-version="${kind}" data-provider="google"></div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

describe("byKind", () => {
  it("hands a script version to the script's handler, a vanilla or React one to the module's", () => {
    const handled = byKind({ script: () => "script", module: () => "module" });
    expect(handled(versionOfKind("script"))).toBe("script");
    expect(handled(versionOfKind("vanilla"))).toBe("module");
    expect(handled(versionOfKind("react"))).toBe("module");
  });

  it("throws for a page's map or an unknown kind, which the site never starts", () => {
    const handled = byKind({ script: () => "script", module: () => "module" });
    expect(() => handled(versionOfKind("html"))).toThrow('of kind "html"');
    expect(() => handled(versionOfKind("leaflet"))).toThrow('of kind "leaflet"');
  });
});
