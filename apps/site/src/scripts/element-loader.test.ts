import { describe, expect, it, vi } from "vitest";
import { releaseOnceDefined } from "./element-loader.ts";

function setup(...outcomes: ("loads" | "fails")[]) {
  const load = vi.fn(() =>
    outcomes.shift() === "fails" ? Promise.reject(new Error("offline")) : Promise.resolve(),
  );
  const log: string[] = [];
  const release = releaseOnceDefined<string>({
    load,
    release: (map) => log.push(`released ${map}`),
    failed: (map) => log.push(`failed ${map}`),
    recovered: (map) => log.push(`recovered ${map}`),
  });
  return { load, log, release };
}

describe("releaseOnceDefined", () => {
  it("loads the element once for every map, releasing each once it is defined", async () => {
    const { load, log, release } = setup("loads");
    await Promise.all([release("rome"), release("milan")]);
    expect(load).toHaveBeenCalledOnce();
    expect(log).toEqual(["released rome", "released milan"]);
  });

  it("keeps a newer load when an older one fails", async () => {
    const load = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve)));
    const asks: Promise<void>[] = [];
    const release = releaseOnceDefined<string>({
      load,
      release: () => {},
      // A map asking while the failure is reported starts the next load.
      failed: (map) => {
        if (map === "rome") asks.push(release("naples"));
      },
      recovered: () => {},
    });
    await Promise.all([release("rome"), release("milan")]);
    asks.push(release("turin"));
    await Promise.all(asks);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("tries a failed load again on the next ask, releasing the maps that waited", async () => {
    const { load, log, release } = setup("fails", "loads");
    await release("rome");
    await release("milan");
    expect(load).toHaveBeenCalledTimes(2);
    expect(log).toEqual(["failed rome", "recovered rome", "released rome", "released milan"]);
  });
});
