import { describe, expect, it } from "vitest";
import { errorsOn, lastAdapter, MILAN, mapFrom, nextTask, ROME } from "./testing/fake-maps";

const ZOOMED = ROME.replace("<maplace-location ", '<maplace-location zoom="9" ');
const UNLISTED = MILAN.replace("<maplace-location ", '<maplace-location listed="false" ');

async function readyMap(html: string) {
  const map = await mapFrom(html);
  const adapter = lastAdapter();
  await adapter.finishMount();
  await map.maplace.whenReady();
  return { map, adapter };
}

describe("<maplace-location>'s view fields", () => {
  it("shows a location at its own zoom when selected", async () => {
    const { map, adapter } = await readyMap(`<maplace-map>${ZOOMED}</maplace-map>`);
    map.maplace.select("rome");
    expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
      kind: "location",
      id: "rome",
      zoom: 9,
    });
  });

  it("leaves a listed=false location out of its list, drawing it on the map", async () => {
    const { map, adapter } = await readyMap(`<maplace-map list>${ROME}${UNLISTED}</maplace-map>`);
    expect(adapter.probe().location("milan")).toBeDefined();
    const list = map.querySelector('[role="listbox"]');
    expect(list?.textContent).toContain("Rome");
    expect(list?.textContent).not.toContain("Milan");
  });

  it.each([
    ["zoom", "near"],
    ["listed", "no"],
  ])("puts the map in error for a %s of %s", async (field, value) => {
    const { map } = await readyMap(`<maplace-map>${ZOOMED}${UNLISTED}</maplace-map>`);
    const errors = errorsOn(map);
    map.querySelector("maplace-location")?.setAttribute(field, value);
    await nextTask();
    expect(errors).toEqual([expect.objectContaining({ code: "invalid-input", field })]);
  });
});
