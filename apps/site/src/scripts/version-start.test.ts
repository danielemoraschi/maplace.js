// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { type VersionStarting, versionStarter } from "./version-start.ts";

function version(keyMissing = false): HTMLElement {
  document.body.innerHTML = `<div class="map-frame"${keyMissing ? " data-maps-key-missing" : ""}>
    <div data-live-version="vanilla" data-example="route"></div>
  </div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

function deferred() {
  let resolve: () => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(overrides: Partial<VersionStarting> = {}) {
  const maps = deferred();
  const steps: string[] = [];
  const starting: VersionStarting = {
    load: vi.fn(async () => {
      steps.push("load");
    }),
    runBootstrap: vi.fn(() => {
      steps.push("bootstrap");
    }),
    mapsJsOnPage: () => false,
    mapsImportable: () => maps.promise,
    failed: vi.fn(),
    ...overrides,
  };
  return { starting, start: versionStarter(starting), maps, steps };
}

describe("versionStarter", () => {
  it("runs the version's bootstrap, waits for Maps JS, then imports its module", async () => {
    const { start, maps, steps } = setup();
    const target = version();
    const started = start(target);
    expect(steps).toEqual(["bootstrap"]);
    expect(target.hasAttribute("data-starting")).toBe(true);
    maps.resolve();
    await started;
    expect(steps).toEqual(["bootstrap", "load"]);
    expect(target.hasAttribute("data-starting")).toBe(false);
    expect(target.hasAttribute("data-started")).toBe(true);
  });

  it("runs no bootstrap when Maps JS is on the page already", async () => {
    const { start, maps, steps } = setup({ mapsJsOnPage: () => true });
    maps.resolve();
    await start(version());
    expect(steps).toEqual(["load"]);
  });

  it("starts a version once", async () => {
    const { start, maps, starting } = setup();
    const target = version();
    maps.resolve();
    await Promise.all([start(target), start(target)]);
    expect(starting.load).toHaveBeenCalledOnce();
  });

  it("says the site has no key, running nothing, when it has none", async () => {
    const { start, starting, steps } = setup();
    const target = version(true);
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, "no-key");
    expect(steps).toEqual([]);
  });

  it("says Maps JS didn't load when the wait fails, importing nothing", async () => {
    const { start, maps, starting, steps } = setup();
    const target = version();
    maps.reject(new Error("a Maps tag failed"));
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, "maps-js");
    expect(steps).toEqual(["bootstrap"]);
    expect(target.hasAttribute("data-starting")).toBe(false);
  });

  it("says the version's script didn't load when its import fails", async () => {
    const load = () => Promise.reject(new Error("offline"));
    const { start, maps, starting } = setup({ load });
    const target = version();
    maps.resolve();
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, "script");
  });
});
