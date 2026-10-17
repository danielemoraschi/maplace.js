// @vitest-environment happy-dom
import { type ReactNode, use } from "react";
import { describe, expect, it, vi } from "vitest";
import { TOWNS } from "./testing/bound-store";
import { inAct, ROOT_MODES } from "./testing/render";
import { iconOf, renderMap, withData } from "./testing/rendered-map";

describe.each(ROOT_MODES)("React content that fails or waits, in $mode", (root) => {
  it("reports a throwing function or component as the page's code failing, the map kept", async () => {
    const onError = vi.fn();
    function Broken(): ReactNode {
      throw new Error("no card");
    }
    const map = await renderMap(
      root,
      {
        markerIcon: (location) => {
          if (location.id === "north") throw new Error("no pin");
          return location.id === "south" ? <Broken /> : "pin";
        },
      },
      { onError },
    );
    const messages = onError.mock.calls.map(([{ error }]) => error.message);
    expect(new Set(messages)).toEqual(
      new Set(['location "north": markerIcon threw', 'location "south": markerIcon threw']),
    );
    // React still logs what a boundary caught (here, the root's onCaughtError); the map stays.
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
