import { afterEach, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { ORIGIN_DOT_CLASS } from "../adapter-kit/origin-dot";
import { presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedGoogle } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

afterEach(unmountAll);

describeWithMaps("the origin's dot on real Google Maps", () => {
  it("centres the dot on its point, and a trusted click on it reaches the map", async () => {
    const { adapter, container, host, probe } = await mountedGoogle();
    const at = { lat: 0, lng: 0 };
    adapter.setView({ kind: "center", center: at, zoom: 3 });
    await probe.settle();
    adapter.present(presented({ origin: at }));
    await expect.poll(() => container.querySelector(`.${ORIGIN_DOT_CLASS}`)).not.toBeNull();
    const dot = container.querySelector(`.${ORIGIN_DOT_CLASS}`) as HTMLElement;
    const { x, y, width, height } = dot.getBoundingClientRect();
    // The map is centred on the origin, so a dot hung above its point would show here.
    const map = container.getBoundingClientRect();
    expect(Math.abs(y + height / 2 - (map.top + map.height / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(x + width / 2 - (map.left + map.width / 2))).toBeLessThanOrEqual(1);
    await commands.pressMouse([{ x: x + width / 2, y: y + height / 2 }]);
    await expect.poll(() => host.reportsOf("reportMapClick")).toHaveLength(1);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
  });
});
