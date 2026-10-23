// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { INERT_SCRIPT_TYPE } from "../examples/page-scripts.ts";
import { scriptVersionStart } from "./script-version.ts";

function scriptVersion(provider: string): HTMLElement {
  document.body.innerHTML = `<div data-live-version="script" data-provider="${provider}">
    <script type="${INERT_SCRIPT_TYPE}" data-type="module">window.ran = true;</script>
  </div>`;
  return document.querySelector("[data-live-version]") as HTMLElement;
}

const inert = (version: HTMLElement) =>
  version.querySelector(`script[type="${INERT_SCRIPT_TYPE}"]`);

describe("scriptVersionStart", () => {
  it("puts its provider's Maplace on the page, then runs the version's program", async () => {
    const installMaplace = vi.fn(async () => {});
    const version = scriptVersion("maplibre");
    await scriptVersionStart(installMaplace)(version);
    expect(installMaplace).toHaveBeenCalledWith("maplibre");
    expect(inert(version)).toBeNull();
    expect(version.querySelector("script")?.type).toBe("module");
  });

  it("runs nothing when its provider's Maplace didn't load", async () => {
    const installMaplace = vi.fn(async () => Promise.reject(new Error("offline")));
    const version = scriptVersion("google");
    await expect(scriptVersionStart(installMaplace)(version)).rejects.toThrow("offline");
    expect(inert(version)).not.toBeNull();
  });
});
