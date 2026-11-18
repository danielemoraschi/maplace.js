// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { straightRoutes } from "../testing/straight-routes";
import type { MaplaceMapElement } from "./index";
import "./maplibre";
import { providerFor } from "./providers";
import { elementWith } from "./testing/dom";

/** A host naming the `maplibre` provider, with these attributes besides. */
const hostWith = (attributes: Record<string, string> = {}) =>
  elementWith({ provider: "maplibre", ...attributes }) as MaplaceMapElement;

describe("@maplacejs/maplace/element/maplibre", () => {
  it("defines the elements and registers the maplibre provider on import", () => {
    expect(customElements.get("maplace-map")).toBeDefined();
    expect(providerFor(hostWith())).toBeTypeOf("function");
  });

  it("routes through the element's computeRoute, read when the map opens", () => {
    const factory = providerFor(hostWith());
    const host = hostWith();
    expect(factory(host).capabilities.has("route")).toBe(false);
    host.computeRoute = straightRoutes;
    expect(factory(host).capabilities.has("route")).toBe(true);
  });

  it("has computeRoute as a property of the defined element, which Svelte sets as one", () => {
    // Svelte sets a prop as a property only when the element's prototype has its setter.
    const prototype = customElements.get("maplace-map")?.prototype;
    const setter = (name: string) => Object.getOwnPropertyDescriptor(prototype, name)?.set;
    expect(["locations", "route", "sanitize", "computeRoute"].map(setter)).not.toContain(undefined);
  });

  it("throws misuse naming computeRoute when it isn't a function", () => {
    const factory = providerFor(hostWith());
    const host = hostWith();
    (host as unknown as { computeRoute: unknown }).computeRoute = "osrm";
    expect(() => factory(host)).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "computeRoute" }),
    );
  });

  it("throws misuse naming map-options.center from the factory", () => {
    const factory = providerFor(hostWith());
    expect(() => factory(hostWith({ "map-options": '{"center":[0,0]}' }))).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "map-options.center" }),
    );
  });
});
