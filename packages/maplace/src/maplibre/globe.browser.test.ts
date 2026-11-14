import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { unmountAll } from "../testing/conformance/harness";
import { queried } from "../testing/queried";
import { unstyledPage } from "../testing/unstyled-page";
import { GLOBE_CLASS } from "./globe";
import { isOnGlobe } from "./projection";
import { mountedMapLibre, mountedOnGlobe } from "./testing/mounted";

afterEach(() => {
  unmountAll();
});

/** The globe's toggle on `map`. */
const toggleOn = (map: MapLibreMap) => queried(map.getContainer(), `.${GLOBE_CLASS}`);

describe("the globe on a MapLibre map", () => {
  it("opens on the globe, its toggle pressed and named Globe, top-left", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    expect(isOnGlobe(map)).toBe(true);
    expect([
      toggle.textContent,
      toggle.getAttribute("type"),
      toggle.getAttribute("aria-pressed"),
    ]).toEqual(["Globe", "button", "true"]);
    expect(toggle.closest(".maplibregl-ctrl-top-left")).not.toBeNull();
  });

  it("the toggle flattens the map and turns the globe back on, its pressed state following", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    await userEvent.click(toggle);
    expect([isOnGlobe(map), toggle.getAttribute("aria-pressed")]).toEqual([false, "false"]);
    await userEvent.click(toggle);
    expect([isOnGlobe(map), toggle.getAttribute("aria-pressed")]).toEqual([true, "true"]);
  });

  it("two clicks with no wait between flatten, then turn the globe back on", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    toggle.click();
    toggle.click();
    expect([isOnGlobe(map), toggle.getAttribute("aria-pressed")]).toEqual([true, "true"]);
  });

  it("the toggle shows a projection set on the map from outside it", async () => {
    const { map } = await mountedOnGlobe();
    map.setProjection({ type: "mercator" });
    expect(toggleOn(map).getAttribute("aria-pressed")).toBe("false");
  });

  it("focused from the keyboard, the toggle shows a focus ring", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    await userEvent.keyboard("{Shift}");
    toggle.focus();
    expect(toggle.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(toggle).outlineStyle).not.toBe("none");
  });

  it("is bold, borderless and tinted when pressed; inside the opt-out, the page's look", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    const look = () => getComputedStyle(toggle);
    expect([look().fontWeight, look().borderStyle]).toEqual(["600", "none"]);
    expect(look().backgroundImage).toContain("linear-gradient");
    onTestFinished(unstyledPage());
    expect(look().fontWeight).not.toBe("600");
  });

  it("under the pointer, still tinted while pressed and not while flat, over MapLibre's own hover", async () => {
    const { map } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    const tint = () => getComputedStyle(toggle).backgroundImage;
    await userEvent.hover(toggle);
    const pressed = tint();
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(tint()).toContain("linear-gradient");
    expect(tint()).not.toBe(pressed);
  });

  it("puts the toggle in the corner and words asked", async () => {
    const { map } = await mountedOnGlobe({ position: "bottom-right", label: "Earth" });
    const toggle = toggleOn(map);
    expect(toggle.textContent).toBe("Earth");
    expect(toggle.closest(".maplibregl-ctrl-bottom-right")).not.toBeNull();
  });

  it("destroy takes the toggle off", async () => {
    const { map, destroy } = await mountedOnGlobe();
    const toggle = toggleOn(map);
    destroy();
    expect(toggle.isConnected).toBe(false);
  });

  it("with no globe asked, leaves the projection flat and adds no toggle", async () => {
    const { map } = await mountedMapLibre();
    expect(isOnGlobe(map)).toBe(false);
    expect(map.getContainer().querySelector(`.${GLOBE_CLASS}`)).toBeNull();
  });
});
