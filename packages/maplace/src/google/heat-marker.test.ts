// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isPinIcon } from "../adapter-kit/pin-icon";
import { markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { pinIconOf } from "../testing/page-icon";
import { createGoogleHeat } from "./heat-overlay";
import { placeMarker } from "./marker";
import { anchorTopOf } from "./testing/stub-libraries";
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

  it("shows maplace's pin over its dot while selected, so the heat hides neither", () => {
    const { placed, dot } = heatMarker();
    placed.present(SELECTED);
    expect(dotAlone(placed.marker)).toBe(false);
    expect(isPinIcon(placed.marker.lastChild ?? undefined)).toBe(true);
    expect(placed.marker.firstChild).toBe(dot());
    placed.present(AT_REST);
    expect(dotAlone(placed.marker)).toBe(true);
  });

  it("shows its dot, not the page's icon, when the page draws every marker's (React's markerIcon)", () => {
    const { placed } = heatMarker();
    placed.update(
      markerDrawable("q", ORIGIN, { heatWeight: 2, renderIcon: () => document.createElement("b") }),
    );
    expect(dotAlone(placed.marker)).toBe(true);
  });

  it("centres a heat marker on its point, its dot alone or under its pin", () => {
    const { placed } = heatMarker();
    expect(anchorTopOf(placed.marker)).toBe("-50%");
    placed.present(SELECTED);
    expect(anchorTopOf(placed.marker)).toBe("-50%");
  });

  it("shows maplace's pin, centred, once it leaves the heat group", () => {
    const { placed } = heatMarker();
    placed.update(markerDrawable("q", ORIGIN));
    expect(placed.marker.childNodes).toHaveLength(1);
    expect(pinIconOf(placed.marker)).toBeDefined();
    expect(anchorTopOf(placed.marker)).toBe("-50%");
  });

  it("puts a page's icon's bottom on the point once it leaves the heat group, and centres it again on rejoining", () => {
    const { placed } = heatMarker();
    const icon = document.createElement("b");
    placed.update(markerDrawable("q", ORIGIN, { renderIcon: () => icon }));
    expect(placed.marker.firstChild).toBe(icon);
    expect(anchorTopOf(placed.marker)).toBeNull();
    placed.update(markerDrawable("q", ORIGIN, { heatWeight: 2, renderIcon: () => icon }));
    expect(anchorTopOf(placed.marker)).toBe("-50%");
  });
});
