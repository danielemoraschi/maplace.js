// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { POINTER_THROUGH_ATTRIBUTE } from "../adapter-kit/pointer-through";
import { markerDrawable, withContent } from "../testing/conformance/fixtures";
import { popupsOn } from "./testing/popups-on";
import type { StubMap } from "./testing/stub-libraries";

/** Hover popups on a stub map of two markers, its popup pane on the page, as Google's is. */
function hoverPopups() {
  const popups = popupsOn(
    ["a", "b"].map((id) => withContent(markerDrawable(id), id)),
    { openOn: "hover" },
  );
  document.body.append((popups.mounted.map as unknown as StubMap).floatPane);
  return {
    async present(next: Partial<PresentationState>) {
      popups.present(next);
      await popups.settled();
    },
    letsPointerThrough: () => popups.window()?.box.hasAttribute(POINTER_THROUGH_ATTRIBUTE) === true,
  };
}

describe("a Google popup and the pointer", () => {
  it("lets the pointer through a hovered location's popup, to what it covers", async () => {
    const popups = hoverPopups();
    await popups.present({ hoveredId: "a" });
    expect(popups.letsPointerThrough()).toBe(true);
  });

  it("takes the pointer once that location is selected, for its close button and links", async () => {
    const popups = hoverPopups();
    await popups.present({ hoveredId: "a" });
    await popups.present({ hoveredId: "a", selectedId: "a" });
    expect(popups.letsPointerThrough()).toBe(false);
  });

  it("takes the pointer on the selected location's popup, and lets it through on another's hover", async () => {
    const popups = hoverPopups();
    await popups.present({ selectedId: "a" });
    expect(popups.letsPointerThrough()).toBe(false);
    await popups.present({ selectedId: "a", hoveredId: "b" });
    expect(popups.letsPointerThrough()).toBe(true);
  });
});
