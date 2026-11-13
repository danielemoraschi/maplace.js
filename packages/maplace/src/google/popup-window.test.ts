// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import {
  BLOCK_GUTTER_PROPERTY,
  GOOGLE_POPUP_ATTRIBUTE,
  INLINE_GUTTER_PROPERTY,
} from "./popup-styles";
import { createPopupWindow } from "./popup-window";
import type { StubInfoWindow } from "./testing/stub-popups";
import { stubMounted } from "./testing/stub-site";

const PLACE = { position: { lat: 0, lng: 0 } };

/** Google's `domready`, which the stub fires in a microtask. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * The map's popup window, its scroll box keeping room for scrollbars as Chromium's does beside
 * Google's styling: 18px at the inline end, 12px below.
 */
function popupWindow() {
  const { mounted } = stubMounted();
  const window = createPopupWindow(mounted, { contentShown: vi.fn(), closedByUser: vi.fn() });
  const stub = window.infoWindow as unknown as StubInfoWindow;
  const sizes = { offsetWidth: 280, clientWidth: 262, offsetHeight: 198, clientHeight: 186 };
  for (const [name, value] of Object.entries(sizes))
    Object.defineProperty(stub.box, name, { value });
  return { window, heading: () => stub.get("headerContent") as HTMLElement };
}

function contentOf(text: string): HTMLElement {
  const element = document.createElement("div");
  element.textContent = text;
  return element;
}

/** The gutter `element` was given: at the inline end, then below. */
const gutterOf = ({ style }: HTMLElement) =>
  [INLINE_GUTTER_PROPERTY, BLOCK_GUTTER_PROPERTY].map((name) => style.getPropertyValue(name));

describe("createPopupWindow", () => {
  it("measures the room Google keeps beside the content once it shows it, for the content and heading to match", async () => {
    const { window, heading } = popupWindow();
    const element = contentOf("Alpha");
    window.open({ element, place: PLACE, title: "Alpha" });
    expect(gutterOf(element)).toEqual(["", ""]);
    await settled();
    expect(gutterOf(element)).toEqual(["18px", "12px"]);
    expect(gutterOf(heading())).toEqual(["18px", "12px"]);
  });

  it("gives new content and a new heading of the open popup the last measure until Google shows them", async () => {
    const { window, heading } = popupWindow();
    window.open({ element: contentOf("Alpha"), place: PLACE, title: "Alpha" });
    await settled();
    const element = contentOf("Alpha, again");
    window.refresh(element);
    window.retitle("Alpha, renamed");
    expect(gutterOf(element)).toEqual(["18px", "12px"]);
    expect(gutterOf(heading())).toEqual(["18px", "12px"]);
  });

  it("marks the heading as Google's, as its content, for Google's popup rules alone to reach", () => {
    const { window, heading } = popupWindow();
    window.open({ element: contentOf("Alpha"), place: PLACE, title: "Alpha" });
    expect(heading().hasAttribute(GOOGLE_POPUP_ATTRIBUTE)).toBe(true);
  });
});
