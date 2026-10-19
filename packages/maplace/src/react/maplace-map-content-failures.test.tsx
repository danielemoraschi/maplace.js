// @vitest-environment happy-dom
import { type ReactNode, use } from "react";
import { describe, expect, it, type Mock, vi } from "vitest";
import type { Location } from "../location";
import { inAct, ROOT_MODES } from "./testing/render";
import { iconOf, renderMap, withData } from "./testing/rendered-map";
import { TOWNS } from "./testing/towns";

function Broken(): ReactNode {
  throw new Error("no card");
}

/** `north`'s icon function throws, `south`'s icon is a component that throws, `east` draws. */
function failingIcons(location: Location): ReactNode {
  if (location.id === "north") throw new Error("no pin");
  return location.id === "south" ? <Broken /> : "pin";
}

/** The messages `onError` was called with, each once: StrictMode renders twice. */
const reported = (onError: Mock) => new Set(onError.mock.calls.map(([{ error }]) => error.message));

describe.each(ROOT_MODES)("React content that fails or waits, in $mode", (root) => {
  it("reports an icon function that throws as the page's code failing", async () => {
    const onError = vi.fn();
    await renderMap(root, { markerIcon: failingIcons }, { onError });
    expect(reported(onError)).toContain('location "north": markerIcon threw');
  });

  it("reports an icon component that throws as the page's code failing", async () => {
    const onError = vi.fn();
    await renderMap(root, { markerIcon: failingIcons }, { onError });
    expect(reported(onError)).toContain('location "south": markerIcon threw');
  });

  it("keeps the map, and the content that doesn't fail, when some does", async () => {
    const onError = vi.fn();
    const map = await renderMap(root, { markerIcon: failingIcons }, { onError });
    expect(reported(onError)).not.toContain('location "east": markerIcon threw');
    expect(map.adapter.destroyed).toBe(false);
    expect(map.container.querySelector("div.map")).not.toBeNull();
    expect([
      iconOf(map.probe, "north")?.textContent,
      iconOf(map.probe, "east")?.textContent,
    ]).toEqual(["", "pin"]);
  });

  it("renders a failed content again once its location changes", async () => {
    let broken = true;
    const markerIcon = () => {
      if (broken) throw new Error("no pin");
      return "pin";
    };
    const map = await renderMap(root, { markerIcon }, { onError: () => {} });
    broken = false;
    await map.render({ markerIcon }, { onError: () => {}, locations: withData(TOWNS, 1) });
    expect(iconOf(map.probe, "north")?.textContent).toBe("pin");
  });

  it("shows nothing for content still suspended, then the content", async () => {
    let resolve: (text: string) => void = () => {};
    const text = new Promise<string>((done) => {
      resolve = done;
    });
    const Later = () => use(text);
    const map = await renderMap(root, { markerIcon: () => <Later /> });
    expect(iconOf(map.probe, "north")?.textContent).toBe("");
    await inAct(() => resolve("pin"));
    expect(iconOf(map.probe, "north")?.textContent).toBe("pin");
  });
});
