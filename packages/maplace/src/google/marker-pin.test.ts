// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { SELECTED_PIN_GLYPH } from "../adapter-kit/pin-palette";
import { markerDrawable } from "../testing/conformance/fixtures";
import { placeMarker } from "./marker";
import { createPlacingSite } from "./placing-site";
import { StubPinElement } from "./testing/stub-libraries";
import { stubMounted } from "./testing/stub-site";

const AT_REST = { state: { selected: false, hovered: false }, visible: true };
const SELECTED = { state: { selected: true, hovered: false }, visible: true };
const HOVERED = { state: { selected: false, hovered: true }, visible: true };

/** A placing site on a map carrying these `--maplace-pin-*` properties (none, by default). */
function siteWithColours(properties: Record<string, string> = {}) {
  const { mounted, state } = stubMounted();
  const div = mounted.map.getDiv();
  for (const [name, value] of Object.entries(properties)) div.style.setProperty(name, value);
  document.body.append(div);
  onTestFinished(() => div.remove());
  return createPlacingSite(mounted, state);
}

/** A pin's colours, as Google takes them. */
const coloursOf = (pin: StubPinElement | undefined) =>
  pin && { background: pin.background, borderColor: pin.borderColor, glyphColor: pin.glyphColor };

/** The pin a marker shows, as maplace made it; none for Google's own. */
const pinOf = (marker: HTMLElement) =>
  marker.firstChild instanceof StubPinElement ? marker.firstChild : undefined;

describe("a default marker's pin", () => {
  it("shows Google's own pin while resting on a page with no pin colours", () => {
    const a = placeMarker(markerDrawable("a"), siteWithColours());
    expect(a.marker.childNodes).toHaveLength(0);
  });

  it("makes no pin for a resting marker on a page with no pin colours", () => {
    const site = siteWithColours();
    const made = vi.spyOn(site.mounted.libraries.marker, "PinElement");
    placeMarker(markerDrawable("a"), site).present(HOVERED);
    expect(made).not.toHaveBeenCalled();
  });

  it("shows the pin with the darker dot while selected", () => {
    const a = placeMarker(markerDrawable("a"), siteWithColours());
    a.present(SELECTED);
    expect(coloursOf(pinOf(a.marker))).toEqual({
      background: null,
      borderColor: null,
      glyphColor: SELECTED_PIN_GLYPH,
    });
  });

  it("brings Google's own pin back once deselected", () => {
    const a = placeMarker(markerDrawable("a"), siteWithColours());
    a.present(SELECTED);
    a.present(AT_REST);
    expect(a.marker.childNodes).toHaveLength(0);
  });

  it("keeps its own pin through selections, painted for each state", () => {
    const a = placeMarker(
      markerDrawable("a"),
      siteWithColours({ "--maplace-pin-background": "#0b6e4f" }),
    );
    const own = pinOf(a.marker);
    a.present(SELECTED);
    expect(pinOf(a.marker)).toBe(own);
    expect(own?.glyphColor).toBe(SELECTED_PIN_GLYPH);
    a.present(AT_REST);
    expect(own?.glyphColor).toBeNull();
  });

  it("takes the page's colours on every pin", () => {
    const a = placeMarker(
      markerDrawable("a"),
      siteWithColours({ "--maplace-pin-background": "#0b6e4f" }),
    );
    expect(coloursOf(pinOf(a.marker))).toEqual({
      background: "#0b6e4f",
      borderColor: null,
      glyphColor: null,
    });
    a.present(SELECTED);
    expect(pinOf(a.marker)?.background).toBe("#0b6e4f");
  });

  it("keeps the same pin through a hover", () => {
    const a = placeMarker(
      markerDrawable("a"),
      siteWithColours({ "--maplace-pin-background": "#0b6e4f" }),
    );
    const resting = pinOf(a.marker);
    a.present(HOVERED);
    expect(pinOf(a.marker)).toBe(resting);
  });
});
