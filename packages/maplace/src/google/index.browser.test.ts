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
    const map = container.querySelector(".maplace-google-map") as HTMLElement;
    expect([map.offsetWidth, map.offsetHeight]).toEqual([MAP_SIZE.width, MAP_SIZE.height]);
    detach();
    expect(container.children).toHaveLength(0);
    container.remove();
  });

  it("shows the store's markers, titled, and takes them off when detached", async () => {
    const locations = [
      { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" },
      { id: "milan", lat: 45.46, lng: 9.19, title: "Milan" },
    ];
    const maplace = createMaplace({ locations });
    const container = sizedContainer();
    const detach = maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
    await maplace.whenReady();
    const titles = () =>
      [...container.querySelectorAll("gmp-advanced-marker")]
        .map((marker) => marker.getAttribute("aria-label") ?? "")
        .sort((a, b) => a.localeCompare(b));
    await expect.poll(titles).toEqual(["Milan", "Rome"]);
    detach();
    expect(titles()).toEqual([]);
    container.remove();
  });
});
