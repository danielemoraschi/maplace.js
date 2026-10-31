// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { markerDrawable, withContent } from "../testing/conformance/fixtures";
import { popupContent, popupStep } from "./popup-content";
import type { PopupLinkSettings } from "./popup-links";

const alpha = withContent(markerDrawable("a"), "Alpha");

const PAGES = { openInMaps: () => "https://a.test/", directions: () => "https://b.test/" };
const NO_LINKS: PopupLinkSettings = {
  options: { openInMapsLabel: undefined, directionsLabel: undefined },
  pages: PAGES,
};
const WITH_LINKS: PopupLinkSettings = {
  options: { openInMapsLabel: "Open", directionsLabel: "Go" },
  pages: PAGES,
};

describe("popupContent", () => {
  it("puts the content in an element of its own, keeping the builder it came from", () => {
    const content = popupContent(alpha, document, NO_LINKS);
    expect(content?.element.textContent).toBe("Alpha");
    expect(content?.builtWith).toBe(alpha.renderContent);
    expect(content?.links).toBeUndefined();
  });

  it("ends the element with the links, already pointing somewhere", () => {
    const content = popupContent(alpha, document, WITH_LINKS);
    expect(content?.element.lastElementChild).toBe(content?.links?.element);
    expect(content?.element.firstChild?.textContent).toBe("Alpha");
    expect(content?.element.querySelector("a")?.getAttribute("href")).toBe("https://a.test/");
  });

  it("gives none for a location with no content, whatever the labels", () => {
    expect(popupContent(markerDrawable("a"), document, WITH_LINKS)).toBeUndefined();
  });

  it("gives none for a location without content, or whose content built nothing", () => {
    expect(popupContent(markerDrawable("a"), document, NO_LINKS)).toBeUndefined();
    const empty = markerDrawable("a", undefined, { renderContent: () => undefined });
    expect(popupContent(empty, document, NO_LINKS)).toBeUndefined();
  });
});

describe("popupStep", () => {
  const shown = { id: "a", builtWith: alpha.renderContent };

  it("keeps a popup showing the content wanted", () => {
    expect(popupStep(shown, alpha)).toBe("keep");
  });

  it("refreshes a popup whose location has new content", () => {
    expect(popupStep(shown, withContent(markerDrawable("a"), "Alpha again"))).toBe("refresh");
  });

  it("replaces it for another location, none, or none shown yet", () => {
    expect(popupStep(shown, withContent(markerDrawable("b"), "Beta"))).toBe("replace");
    expect(popupStep(shown, undefined)).toBe("replace");
    expect(popupStep(undefined, alpha)).toBe("replace");
  });
});
