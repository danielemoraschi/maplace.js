import { expect } from "vitest";
import { type ExampleBehaviour, textIn } from "./reading";

/** Rome's popup shows, ending in its links, and a click on Naples, which has none, shows none. */
export const popups: ExampleBehaviour = async ({ adapter }) => {
  const probe = adapter.probe();
  probe.click("rome");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, "p")).toBe("Capital of Italy.");
  expect(probe.shownPopup()?.heading).toBe("Rome");
  const links = probe.shownPopup()?.element.querySelectorAll("a") ?? [];
  expect([...links].map(({ textContent }) => textContent)).toEqual(["Open in Maps", "Directions"]);
  probe.click("naples");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()).toBeUndefined();
};
