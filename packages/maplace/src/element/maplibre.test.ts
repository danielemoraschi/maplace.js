// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { MaplaceMapElement } from "./index";
import "./maplibre";
import { providerFor } from "./providers";
import { elementWith } from "./testing/dom";

/** A host naming the `maplibre` provider, with these attributes besides. */
const hostWith = (attributes: Record<string, string> = {}) =>
  elementWith({ provider: "maplibre", ...attributes }) as MaplaceMapElement;

describe("maplace/element/maplibre", () => {
  it("defines the elements and registers the maplibre provider on import", () => {
    expect(customElements.get("maplace-map")).toBeDefined();
    expect(providerFor(hostWith())).toBeTypeOf("function");
  });

  it("throws misuse naming map-options.center from the factory", () => {
    const factory = providerFor(hostWith());
    expect(() => factory(hostWith({ "map-options": '{"center":[0,0]}' }))).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "map-options.center" }),
    );
  });
});
