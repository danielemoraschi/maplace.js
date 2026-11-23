import { afterEach, describe, expect, it } from "vitest";
import { pinImageUrl } from "../adapter-kit/pin-image";
import type { LocationState } from "../location";
import { markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { pinIconOf } from "../testing/page-icon";
import { placeMarker } from "./marker";
import { createPlacingSite } from "./placing-site";
import { anchorTopOf } from "./testing/stub-libraries";
import { stubMounted } from "./testing/stub-site";

afterEach(() => document.body.replaceChildren());

const AT_REST = { state: { selected: false, hovered: false }, visible: true };
const SELECTED = { state: { selected: true, hovered: false }, visible: true };
const HOVERED = { state: { selected: false, hovered: true }, visible: true };

/** A placing site on a map carrying these `--maplace-pin-*` properties (none, by default). */
function siteWithColours(properties: Record<string, string> = {}) {
  const { mounted, state } = stubMounted();
  const div = mounted.map.getDiv();
  for (const [name, value] of Object.entries(properties)) div.style.setProperty(name, value);
  document.body.append(div);
  return createPlacingSite(mounted, state);
}

describe("a default marker's pin on Google", () => {
  it("shows maplace's pin on every default marker, at rest too", () => {
    const site = siteWithColours();
    const a = placeMarker(markerDrawable("a"), site);
    expect(pinIconOf(a.marker)?.getAttribute("src")).toBe(
      pinImageUrl(document, site.pinLooks.resting),
    );
  });

  it("keeps one pin through every state, drawn for each", () => {
    const site = siteWithColours();
    const a = placeMarker(markerDrawable("a"), site);
    const pin = pinIconOf(a.marker);
    for (const [look, state] of [
      ["selected", SELECTED],
      ["hovered", HOVERED],
      ["resting", AT_REST],
    ] as const) {
      a.present(state);
      expect(pinIconOf(a.marker)).toBe(pin);
      expect(pin?.getAttribute("src")).toBe(pinImageUrl(document, site.pinLooks[look]));
    }
  });

  it("draws the page's colours", () => {
    const site = siteWithColours({ "--maplace-pin-background": "#0b6e4f" });
    const a = placeMarker(markerDrawable("a"), site);
    expect(site.pinLooks.resting.background).toBe("#0b6e4f");
    expect(pinIconOf(a.marker)?.getAttribute("src")).toBe(
      pinImageUrl(document, site.pinLooks.resting),
    );
  });

  it("centres the marker on maplace's pin, and on a page's icon by its bottom", () => {
    const site = siteWithColours();
    const icon = document.createElement("i");
    const renderIcon = (state: LocationState) => (state.selected ? icon : undefined);
    const a = placeMarker(markerDrawable("a", ORIGIN, { renderIcon }), site);
    const anchorTop = () => anchorTopOf(a.marker);
    expect(anchorTop()).toBe("-50%");
    a.present(SELECTED);
    expect(a.marker.firstChild).toBe(icon);
    expect(anchorTop()).toBeNull();
    a.present(AT_REST);
    expect(anchorTop()).toBe("-50%");
  });
});
