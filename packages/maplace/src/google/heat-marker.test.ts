// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { createGoogleHeat } from "./heat-overlay";
import { placeMarker } from "./marker";
import { stubSite } from "./testing/stub-site";

const SELECTED = { state: { selected: true, hovered: false }, visible: true };
const AT_REST = { state: { selected: false, hovered: false }, visible: true };

/** Whether the marker shows its dot alone, which the heat hides below the fade. */
const dotAlone = (marker: HTMLElement) =>
  marker.children.length === 1 && marker.firstElementChild?.classList.contains("maplace-heat-dot");

/** A heat marker weighing `heatWeight` on a map whose heaviest heat marker weighs 4. */
function heatMarker(heatWeight = 2) {
  const heat = createGoogleHeat(9);
  const { site, state, mounted } = stubSite(undefined, heat);
  heat.open(mounted, state);
  state.placed.set(
    "heaviest",
    placeMarker(markerDrawable("heaviest", ORIGIN, { heatWeight: 4 }), site),
  );
  heat.drawn();
  const placed = placeMarker(markerDrawable("q", ORIGIN, { heatWeight }), site);
  const dot = () => placed.marker.querySelector<HTMLElement>(".maplace-heat-dot");
  return { placed, dot };
}

describe("a heat marker on Google", () => {
  it("shows its dot alone, which hides under the heat, sized by its weight against the heaviest", () => {
    const { placed, dot } = heatMarker(4);
    const light = heatMarker(1);
    expect(dotAlone(placed.marker)).toBe(true);
    expect(placed.marker.children).toHaveLength(1);
    expect(Number.parseFloat(dot()?.style.width ?? "0")).toBeGreaterThan(
      Number.parseFloat(light.dot()?.style.width ?? "0"),
    );
  });

  it("shows Google's pin over its dot while selected, so the heat hides neither", () => {
    const { placed, dot } = heatMarker();
    placed.present(SELECTED);
    expect(dotAlone(placed.marker)).toBe(false);
    expect(placed.marker.querySelector(".stub-pin")).not.toBeNull();
    expect(dot()).not.toBeNull();
    placed.present(AT_REST);
    expect(placed.marker.querySelector(".stub-pin")).toBeNull();
    expect(dotAlone(placed.marker)).toBe(true);
  });

  it("shows its dot, not the page's icon, when the page draws every marker's (React's markerIcon)", () => {
    const { placed } = heatMarker();
    placed.update(
      markerDrawable("q", ORIGIN, { heatWeight: 2, renderIcon: () => document.createElement("b") }),
    );
    expect(dotAlone(placed.marker)).toBe(true);
  });

  it("shows Google's default pin once it leaves the heat group", () => {
    const { placed } = heatMarker();
    placed.update(markerDrawable("q", ORIGIN));
    expect(placed.marker.childNodes).toHaveLength(0);
    expect(dotAlone(placed.marker)).toBe(false);
  });
});
