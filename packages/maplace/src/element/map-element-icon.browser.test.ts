import { describe, expect, it } from "vitest";
import type { Location } from "../index";
import type { MaplaceMapElement } from "./index";
import {
  connect,
  errorsOn,
  lastAdapter,
  MILAN,
  mapFrom,
  nextTask,
  ROME,
  unconnectedMap,
} from "./testing/fake-maps";

const ROME_STARRED = ROME.replace("></", "><template data-icon><span>★</span></template></");

/** An icon naming its location: `<b>milan</b>`. */
const namedIcon = ({ id }: Location) => {
  const icon = document.createElement("b");
  icon.textContent = id;
  return icon;
};

/** A map from `html`, given `icon` as its `markerIcon` before it connects. */
async function mapWithIcon(html: string, icon = namedIcon): Promise<MaplaceMapElement> {
  const map = unconnectedMap(html);
  map.markerIcon = icon;
  await connect(map);
  return map;
}

async function drawnIcon(id: string): Promise<string | undefined> {
  const adapter = lastAdapter();
  await adapter.finishMount();
  await expect.poll(() => adapter.probe().location(id)).toBeDefined();
  return (adapter.probe().location(id)?.icon as Element | undefined)?.outerHTML;
}

describe("<maplace-map> markerIcon", () => {
  it("draws every marker without its own icon with the markerIcon function", async () => {
    await mapWithIcon(`<maplace-map>${MILAN}</maplace-map>`);
    expect(await drawnIcon("milan")).toBe("<b>milan</b>");
  });

  it("wins over the map's template, a location's own icon winning over it", async () => {
    await mapWithIcon(
      `<maplace-map><template data-icon><i>pin</i></template>${MILAN}${ROME_STARRED}</maplace-map>`,
    );
    expect(await drawnIcon("milan")).toBe("<b>milan</b>");
    expect(await drawnIcon("rome")).toBe("<span>★</span>");
  });

  it("is misuse set once the store is made, until the first is back", async () => {
    const map = await mapWithIcon(`<maplace-map>${MILAN}</maplace-map>`);
    const errors = errorsOn(map);
    map.markerIcon = () => document.createElement("i");
    expect(errors.map(({ field }) => field)).toEqual(["markerIcon"]);
    expect(map.loadState).toBe("error");
    map.markerIcon = namedIcon;
    expect(map.loadState).not.toBe("error");
  });

  it("is taken from a held map's script before release", async () => {
    const map = await mapFrom(`<maplace-map hold>${MILAN}</maplace-map>`);
    map.markerIcon = namedIcon;
    map.release();
    expect(await drawnIcon("milan")).toBe("<b>milan</b>");
  });

  it("is taken when set before the element was defined", async () => {
    const inert = document.implementation.createHTMLDocument();
    const map = inert.createElement("maplace-map") as HTMLElement & { markerIcon: unknown };
    map.innerHTML = MILAN;
    map.markerIcon = namedIcon;
    document.body.replaceChildren(document.adoptNode(map));
    await nextTask();
    expect(await drawnIcon("milan")).toBe("<b>milan</b>");
  });

  it("leaves out one that isn't an icon for the map's template", async () => {
    await mapWithIcon(
      `<maplace-map><template data-icon><i>pin</i></template>${MILAN}</maplace-map>`,
      42 as never,
    );
    expect(await drawnIcon("milan")).toBe("<i>pin</i>");
  });

  it("leaves out one that isn't an icon, as misuse naming it, a listener hearing of it given the one store", async () => {
    const map = unconnectedMap(`<maplace-map>${MILAN}</maplace-map>`);
    map.markerIcon = 42 as never;
    const stores: unknown[] = [];
    const errors = errorsOn(map);
    map.addEventListener("maplace-error", () => stores.push(map.maplace));
    await connect(map);
    expect(errors.map(({ code, field }) => [code, field])).toEqual([
      ["invalid-input", "markerIcon"],
    ]);
    expect([stores, map.markerIcon]).toEqual([[map.maplace], undefined]);
  });
});
