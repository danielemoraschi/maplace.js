// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { markerDrawable, withContent } from "../testing/conformance/fixtures";
import { popupContent, popupStep } from "./popup-content";

const alpha = withContent(markerDrawable("a"), "Alpha");

describe("popupContent", () => {
  it("puts the content in an element of its own, keeping the builder it came from", () => {
    const content = popupContent(alpha, document);
    expect(content?.element.textContent).toBe("Alpha");
    expect(content?.builtWith).toBe(alpha.renderContent);
  });

  it("gives none for a location without content, or whose content built nothing", () => {
    expect(popupContent(markerDrawable("a"), document)).toBeUndefined();
    const empty = markerDrawable("a", undefined, { renderContent: () => undefined });
    expect(popupContent(empty, document)).toBeUndefined();
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
