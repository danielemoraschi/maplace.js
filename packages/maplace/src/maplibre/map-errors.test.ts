import { describe, expect, it } from "vitest";
import { styleErrorOf } from "./map-errors";

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
