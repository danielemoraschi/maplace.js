import { expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { sizedContainer } from "../testing/container";
import { MAP_SIZE } from "../testing/map-probe";
import { createGoogleAdapter } from "./index";
import { describeWithMaps } from "./testing/with-maps";

describeWithMaps("a store on Google Maps", () => {
  it("becomes ready with its map filling the container, and leaves nothing on detach", async () => {
    const maplace = createMaplace({ locations: [{ id: "a", lat: 45, lng: 9 }] });
    const container = sizedContainer();
    const detach = maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
    await maplace.whenReady();
    expect(maplace.getSnapshot().loadState).toBe("ready");
    const map = container.firstElementChild as HTMLElement;
    expect([map.offsetWidth, map.offsetHeight]).toEqual([MAP_SIZE.width, MAP_SIZE.height]);
    detach();
    expect(container.children).toHaveLength(0);
    container.remove();
  });
});
