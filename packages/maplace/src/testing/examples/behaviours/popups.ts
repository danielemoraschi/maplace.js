import { expect } from "vitest";
import { type ExampleBehaviour, firstView, textIn, textsIn } from "./reading";

const FIRST_VIEW = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };
const VENICE_FACTS = ["Over 400 bridges", "No cars, only boats"];

/** The map opens on Italy's north; Rome's popup shows its line and links, Venice's a list too. */
export const popups: ExampleBehaviour = async ({ adapter }) => {
  expect(firstView(adapter)).toEqual(FIRST_VIEW);
  const probe = adapter.probe();
  probe.click("rome");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, "p")).toBe("Capital of Italy.");
  expect(probe.shownPopup()?.heading).toBe("Rome");
  expect(textsIn(probe.shownPopup()?.element, "a")).toEqual(["Open in Maps", "Directions"]);
  probe.click("venice");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()?.heading).toBe("Venice");
  expect(textsIn(probe.shownPopup()?.element, "li")).toEqual(VENICE_FACTS);
};
