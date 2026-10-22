// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { VersionStartFailure, type VersionStarting, versionStarter } from "./version-start.ts";

function version(): HTMLElement {
  document.body.innerHTML = `<div class="map-frame">
    <div data-live-version="vanilla" data-provider="maplibre" data-example="simple"></div>
  </div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(overrides: Partial<VersionStarting> = {}) {
  const readied = deferred();
  const steps: string[] = [];
  const starting: VersionStarting = {
    ready: vi.fn(async () => {
      steps.push("ready");
      await readied.promise;
    }),
    load: vi.fn(async () => {
      steps.push("load");
    }),
    failed: vi.fn(),
    ...overrides,
  };
  return { starting, start: versionStarter(starting), readied, steps };
}

describe("versionStarter", () => {
  it("readies the version, then imports its module, marking each stage", async () => {
    const { start, readied, steps } = setup();
    const target = version();
    const started = start(target);
    expect(steps).toEqual(["ready"]);
    expect(target.hasAttribute("data-starting")).toBe(true);
    readied.resolve();
    await started;
    expect(steps).toEqual(["ready", "load"]);
    expect(target.hasAttribute("data-starting")).toBe(false);
    expect(target.hasAttribute("data-started")).toBe(true);
  });

  it("says why when it can't be readied, importing nothing", async () => {
    const ready = () => Promise.reject(new VersionStartFailure("no-key"));
    const { start, starting, steps } = setup({ ready });
    const target = version();
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, "no-key");
    expect(steps).toEqual([]);
    expect(target.hasAttribute("data-starting")).toBe(false);
    expect(target.hasAttribute("data-started")).toBe(false);
  });

  it("says the script didn't load when readying or the import fails otherwise", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const offline = () => Promise.reject(new Error("offline"));
    for (const overrides of [{ ready: offline }, { load: offline }]) {
      const { start, starting } = setup({ ready: async () => {}, ...overrides });
      const target = version();
      await start(target);
      expect(starting.failed).toHaveBeenCalledWith(target, "script");
    }
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("starts a version once", async () => {
    const { start, readied, starting } = setup();
    const target = version();
    readied.resolve();
    await Promise.all([start(target), start(target)]);
    expect(starting.load).toHaveBeenCalledOnce();
  });

  it("runs a version ready at once, with no key or Maps JS to wait for: MapLibre's", async () => {
    const { start, starting } = setup({ ready: async () => {} });
    const target = version();
    await start(target);
    expect(starting.failed).not.toHaveBeenCalled();
    expect(starting.load).toHaveBeenCalledWith(target);
    expect(target.hasAttribute("data-started")).toBe(true);
  });
});
