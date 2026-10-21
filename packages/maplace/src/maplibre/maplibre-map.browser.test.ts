import "./testing/stylesheet";
import { afterEach, describe, expect, it } from "vitest";
import { sizedContainer } from "../testing/container";
import { createMapLibreMap } from "./maplibre-map";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  document.body.replaceChildren();
});

const LOCATIONS = [
  { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" },
  { id: "milan", lat: 45.46, lng: 9.19, title: "Milan" },
];

/** A store on a MapLibre map made in a new container, with its list, once ready. */
async function readyMapWithList() {
  const container = sizedContainer();
  const maplace = createMapLibreMap(container, {
    mapStyle: TEST_STYLE,
    locations: LOCATIONS,
    list: true,
  });
  await maplace.whenReady();
  return { container, maplace };
}

describe("createMapLibreMap", () => {
  it("draws the store's locations on a MapLibre map, with its list on the map", async () => {
    const { container, maplace } = await readyMapWithList();
    const list = container.querySelector(".maplibregl-ctrl-top-right .maplace-list-view");
    expect(list?.textContent).toContain("Rome");
    maplace.destroy();
  });

  it("takes the map and its list down on destroy, leaving the container as it was", async () => {
    const { container, maplace } = await readyMapWithList();
    maplace.destroy();
    expect(container.children).toHaveLength(0);
  });
});
