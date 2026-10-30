import { expect } from "vitest";
import { isListed } from "../../../location-state";
import { controlPositions, type ExampleBehaviour, inputLabelled } from "./reading";

/** `fieldset` without the browser's groove and padding, inside the map's panel. */
function expectBorderless(fieldset: Element | null): void {
  if (fieldset === null) throw new Error("no fieldset");
  const style = getComputedStyle(fieldset);
  expect([style.borderStyle, style.padding]).toEqual(["none", "0px"]);
}

/** A list of the page's own: a radio per listed location, and one to fit all. */
export const customList: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  await expect
    .poll(() => root.querySelector("fieldset legend")?.textContent)
    .toBe("Choose a location:");
  expectBorderless(root.querySelector("fieldset"));
  const radios = root.querySelectorAll("fieldset input[type=radio]");
  const { locations, filter } = store.getSnapshot();
  const listed = locations.filter((location) => isListed(location, filter));
  expect(radios).toHaveLength(listed.length + 1);
  expect(inputLabelled(root, "Fit all").checked).toBe(true);

  inputLabelled(root, "Milan").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("milan");

  const fits = adapter.callsOf("setView").length;
  inputLabelled(root, "Fit all").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBeUndefined();
  await expect.poll(() => adapter.callsOf("setView").length).toBeGreaterThan(fits);
  expect(adapter.callsOf("setView").at(-1)?.view.kind).toBe("fit-bounds");

  adapter.probe().click("rome");
  await expect.poll(() => inputLabelled(root, "Rome").checked).toBe(true);
  expect(inputLabelled(root, "Fit all").checked).toBe(false);
};
