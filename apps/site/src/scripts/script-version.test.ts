// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { INERT_SCRIPT_TYPE } from "../examples/page-scripts.ts";
import { scriptVersionStart } from "./script-version.ts";

const PROGRAM = "window.ran = true;";

function scriptVersion(provider: string): HTMLElement {
  document.body.innerHTML = `<div data-live-version="script" data-provider="${provider}">
    <script type="${INERT_SCRIPT_TYPE}" data-type="module">${PROGRAM}</script>
  </div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

const inert = (version: HTMLElement) =>
  version.querySelector(`script[type="${INERT_SCRIPT_TYPE}"]`);

describe("scriptVersionStart", () => {
  it("puts its provider's Maplace on the page, then runs the version's program, as written, once", async () => {
    const order: string[] = [];
    const installMaplace = vi.fn(async (provider: string) => {
      order.push(`install ${provider}`);
    });
    const runModule = vi.fn(async (program: string) => {
      order.push(`run ${program}`);
    });
    const version = scriptVersion("maplibre");
    const start = scriptVersionStart(installMaplace, runModule);
    await start(version);
    await start(version);
    expect(order).toEqual(["install maplibre", `run ${PROGRAM}`, "install maplibre"]);
    expect(inert(version)).toBeNull();
  });

  it("fails the start when its program throws as it runs", async () => {
    const runModule = vi.fn(async () => Promise.reject(new Error("thrown")));
    const version = scriptVersion("maplibre");
    await expect(scriptVersionStart(async () => {}, runModule)(version)).rejects.toThrow("thrown");
  });

  it("runs nothing when its provider's Maplace didn't load", async () => {
    const installMaplace = vi.fn(async () => Promise.reject(new Error("offline")));
    const runModule = vi.fn(async () => {});
    const version = scriptVersion("google");
    await expect(scriptVersionStart(installMaplace, runModule)(version)).rejects.toThrow("offline");
    expect(runModule).not.toHaveBeenCalled();
    expect(inert(version)).not.toBeNull();
  });
});
