// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { NO_KEY, NOT_LOADED } from "./version-failures.ts";
import {
  failingWith,
  VersionStartFailure,
  type VersionStarting,
  versionStarter,
} from "./version-start.ts";

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
    const ready = () => Promise.reject(new VersionStartFailure(NO_KEY));
    const { start, starting, steps } = setup({ ready });
    const target = version();
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, NO_KEY);
    expect(steps).toEqual([]);
    expect(target.hasAttribute("data-starting")).toBe(false);
    expect(target.hasAttribute("data-started")).toBe(false);
  });

  it("says the module failed when readying or the import fails otherwise", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const offline = () => Promise.reject(new Error("offline"));
    for (const overrides of [{ ready: offline }, { load: offline }]) {
      const { start, starting } = setup({ ready: async () => {}, ...overrides });
      const target = version();
      await start(target);
      expect(starting.failed).toHaveBeenCalledWith(target, "module");
    }
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("logs the cause of a failure it was given one with", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const thrown = new Error("thrown");
    const load = () => Promise.reject(new VersionStartFailure("program", { cause: thrown }));
    const { start, starting } = setup({ ready: async () => {}, load });
    const target = version();
    await start(target);
    expect(starting.failed).toHaveBeenCalledWith(target, "program");
    expect(console.error).toHaveBeenCalledWith(expect.any(String), thrown);
  });

  it("logs a cause once, however many versions fail with it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mapsJs = new Error("Maps JS didn't load");
    const ready = () => Promise.reject(new VersionStartFailure(NOT_LOADED, { cause: mapsJs }));
    const { start } = setup({ ready });
    await start(version());
    await start(version());
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("logs nothing for a failure that has no cause to tell", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const ready = () => Promise.reject(new VersionStartFailure(NO_KEY));
    await setup({ ready }).start(version());
    expect(logged).not.toHaveBeenCalled();
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

describe("VersionStartFailure", () => {
  it("names the failure for the developer, with the field it concerns", () => {
    expect(new VersionStartFailure(NO_KEY).message).toContain("invalid-input (api-key)");
    expect(new VersionStartFailure("program").message).toContain("program");
  });
});

describe("failingWith", () => {
  it("turns a step's rejection, or its throw, into the version's failure, its cause kept", async () => {
    const offline = new Error("offline");
    for (const step of [
      () => Promise.reject(offline),
      () => {
        throw offline;
      },
    ]) {
      const failure = await failingWith("script", step)().catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(VersionStartFailure);
      expect(failure).toMatchObject({ failure: "script", cause: offline });
    }
  });

  it("passes a step that resolves, with its arguments or none", async () => {
    const step = vi.fn(async (_first: string, _second: number) => "done");
    await expect(failingWith("module", step)("a", 1)).resolves.toBeUndefined();
    expect(step).toHaveBeenCalledWith("a", 1);
    await expect(failingWith("module", async () => {})()).resolves.toBeUndefined();
  });
});
