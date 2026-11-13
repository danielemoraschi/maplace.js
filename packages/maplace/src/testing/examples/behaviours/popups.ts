import { expect } from "vitest";
import { type ExampleBehaviour, firstView, textIn, textsIn } from "./reading";

const FIRST_VIEW = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };

/** The map opens on Italy's north; each place's popup is its card, then its two links. */
export const popups: ExampleBehaviour = async ({ adapter }) => {
  expect(firstView(adapter)).toEqual(FIRST_VIEW);
  const probe = adapter.probe();
  probe.click("colosseum");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, ".place-category")).toBe("Landmark");
  const popup = probe.shownPopup()?.element;
  expect(probe.shownPopup()?.heading).toBe("Colosseum");
  expect(popup?.querySelector("img")?.getAttribute("alt")).toBe(
    "The Colosseum's arches behind a row of cypresses",
  );
  expect(textIn(popup, ".place-hours")).toBe("9:00–19:15");
  expect(textIn(popup, ".place-score")).toBe("4.7");
  expect(textIn(popup, ".place-reviews")).toBe("(412,301 reviews)");
  expect(textsIn(popup, "a")).toEqual(["Open in Maps", "Directions"]);
  probe.click("st-marks");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()?.heading).toBe("St Mark's Basilica");
  expect(textIn(probe.shownPopup()?.element, ".place-category")).toBe("Basilica");
};
