import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeMapErrors, styleErrorOf } from "./map-errors";

/** A failed request as MapLibre's `AJAXError` carries it. */
const failedRequest = (status: number) => Object.assign(new Error("request failed"), { status });

describe("styleErrorOf", () => {
  it("takes a style its server refused for an auth failure", () => {
    for (const status of [401, 403]) {
      expect(styleErrorOf(failedRequest(status))).toMatchObject({
        code: "provider-auth-failed",
        message: `mount: the map style's server refused it (HTTP ${status}): check the key in its URL`,
      });
    }
  });

  it("takes any other failure for a load failure, the cause kept", () => {
    const missing = failedRequest(404);
    expect(styleErrorOf(missing)).toMatchObject({
      code: "provider-load-failed",
      message: "mount: the map style failed to load",
      cause: missing,
    });
    expect(styleErrorOf(new Error("bad JSON")).code).toBe("provider-load-failed");
  });
});

/** A map as `routeMapErrors` hears one, no style yet unless `style` is given. */
function fakeMap(style?: object) {
  const listeners = new Set<(event: object) => void>();
  return {
    map: {
      getStyle: () => style,
      on: (_: string, listener: (event: object) => void) => listeners.add(listener),
      off: (_: string, listener: (event: object) => void) => listeners.delete(listener),
      listens: () => listeners.size > 0,
    } as unknown as MapLibreMap,
    fire: (event: object) => {
      for (const listener of [...listeners]) listener(event);
    },
  };
}

describe("routeMapErrors", () => {
  afterEach(() => vi.restoreAllMocks());

  const routed = () => {
    const { map, fire } = fakeMap();
    const styleFailed = vi.fn();
    routeMapErrors(map, { styleFailed, sourceFailed: vi.fn() });
    return { fire, styleFailed };
  };

  it("takes MapLibre's worker message before the style loaded for no style failure, and logs it", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fire, styleFailed } = routed();
    const error = new Error("Worker failed to load. Check that the worker URL is correct.");
    fire({ error });
    expect(styleFailed).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(error);
  });

  it("takes an event with no error before the style loaded for the style's, not throwing", () => {
    const { fire, styleFailed } = routed();
    fire({});
    fire({ error: null });
    expect(styleFailed).toHaveBeenCalledTimes(2);
  });

  it("takes another error before the style loaded for the style's", () => {
    const { fire, styleFailed } = routed();
    fire({ error: new Error("bad JSON") });
    expect(styleFailed).toHaveBeenCalledOnce();
  });
});
