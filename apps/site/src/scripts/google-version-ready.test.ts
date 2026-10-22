// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { type GoogleReadying, googleVersionReady } from "./google-version-ready.ts";
import { VersionStartFailure } from "./version-start.ts";

function version(keyMissing = false): HTMLElement {
  const marked = keyMissing ? " data-maps-key-missing" : "";
  document.body.innerHTML = `<div class="map-frame">
    <div data-live-version="vanilla" data-provider="google" data-example="route"${marked}></div>
  </div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

function setup(overrides: Partial<GoogleReadying> = {}) {
  const steps: string[] = [];
  const readying: GoogleReadying = {
    runBootstrap: vi.fn(() => {
      steps.push("bootstrap");
    }),
    mapsJsOnPage: () => false,
    mapsImportable: vi.fn(async () => {
      steps.push("maps js");
    }),
    ...overrides,
  };
  return { ready: googleVersionReady(readying), readying, steps };
}

/** What `ready` rejected with, as the version starter reads it. */
async function failureOf(readied: Promise<void>): Promise<unknown> {
  const error = await readied.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error instanceof VersionStartFailure ? error.failure : error;
}

describe("googleVersionReady", () => {
  it("runs the bootstrap, then waits for Maps JS", async () => {
    const { ready, readying, steps } = setup();
    const target = version();
    await ready(target);
    expect(steps).toEqual(["bootstrap", "maps js"]);
    expect(readying.runBootstrap).toHaveBeenCalledWith(target);
  });

  it("runs no bootstrap when Maps JS is on the page", async () => {
    const { ready, steps } = setup({ mapsJsOnPage: () => true });
    await ready(version());
    expect(steps).toEqual(["maps js"]);
  });

  it("fails with no-key, running nothing, in a version without the site's key", async () => {
    const { ready, steps } = setup();
    expect(await failureOf(ready(version(true)))).toBe("no-key");
    expect(steps).toEqual([]);
  });

  it("fails with maps-js when the wait fails", async () => {
    const mapsImportable = () => Promise.reject(new Error("a Maps tag failed"));
    const { ready } = setup({ mapsImportable });
    expect(await failureOf(ready(version()))).toBe("maps-js");
  });
});
