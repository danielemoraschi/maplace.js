import { afterEach, describe, expect, it, vi } from "vitest";
import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { adoptStyles } from "../adopted-styles";
import { createMaplace } from "../maplace/create";
import { POPUP_STYLES as MAPLIBRE_POPUP_STYLES } from "../maplibre/popup-styles";
import { queried } from "../testing/queried";
import { onGoogle } from "./testing/store-on-google";
import { stubMapsJsRecording } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/** A titled location's popup open on a Google map of stubs, on a page holding MapLibre's popup sheet. */
async function googlePopupBesideMapLibre(): Promise<HTMLElement> {
  adoptStyles(document, MAPLIBRE_POPUP_STYLES);
  stubMapsJsRecording();
  const paragraph = document.createElement("p");
  paragraph.textContent = "One";
  const maplace = createMaplace({
    locations: [{ id: "a", lat: 0, lng: 0, title: "Alpha", content: paragraph }],
  });
  await onGoogle(maplace);
  maplace.select("a");
  await expect.poll(() => document.querySelector(`.${POPUP_CLASS}`)).not.toBeNull();
  return queried(document.body, `.${POPUP_CLASS}`);
}

// In a file of its own: its page adopts MapLibre's popup sheet, which no other Google file does.
describe("Google's popup on a page holding MapLibre's popup sheet", () => {
  it("keeps Google's popup heading as Google draws it", async () => {
    await googlePopupBesideMapLibre();
    const style = getComputedStyle(queried(document.body, `.${POPUP_HEADING_CLASS}`));
    expect([style.display, style.fontWeight]).toEqual(["inline", "400"]);
  });

  it("keeps Google's inset on Google's popup content", async () => {
    const content = await googlePopupBesideMapLibre();
    expect(getComputedStyle(content).padding).toBe("0px 12px 12px 0px");
  });
});
