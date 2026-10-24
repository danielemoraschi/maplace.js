import { expect, it } from "vitest";
import { POPUP_CLASS } from "../adapter-kit/popup-content";
import { adoptStyles } from "../adopted-styles";
import { POPUP_STYLES as GOOGLE_POPUP_STYLES } from "../google/popup-styles";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { onMapLibre } from "./testing/control-site";

// In a file of its own: its page adopts Google's popup sheet, which no other MapLibre file does.
it("keeps Google's inset and margins off MapLibre's popups, on a page holding Google's popup sheet", async () => {
  adoptStyles(document, GOOGLE_POPUP_STYLES);
  const paragraphs = document.createElement("div");
  paragraphs.innerHTML = "<p>One</p><p>Two</p>";
  const maplace = createMaplace({ locations: [{ id: "a", lat: 0, lng: 0, content: paragraphs }] });
  const { map } = await onMapLibre(maplace);
  maplace.select("a");
  const container = map.getContainer();
  await expect.poll(() => container.querySelector(`.${POPUP_CLASS} p`)).not.toBeNull();
  const content = queried(container, `.${POPUP_CLASS}`);
  const first = queried(content, "p");
  expect(getComputedStyle(content).padding).toBe("0px");
  expect(getComputedStyle(first).marginTop).not.toBe("0px");
});
