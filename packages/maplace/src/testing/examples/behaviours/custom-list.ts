import { expect } from "vitest";
import { isListed } from "../../../location-state";
import { byText, controlPositions, type ExampleBehaviour } from "./reading";

/** The radio labelled `text` inside `root`. */
function choiceIn(root: Element, text: string): HTMLInputElement {
  const radio = byText(root, "fieldset label", text).querySelector("input");
  if (radio === null) throw new Error(`the choice "${text}" has no radio`);
  return radio;
}

/** 0.2's "checks" menu, built by the page: a radio per listed location, and one to fit all. */
export const customList: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-left"]);
  await expect
    .poll(() => root.querySelector("fieldset legend")?.textContent)
    .toBe("Choose a location:");
  const radios = root.querySelectorAll("fieldset input[type=radio]");
  const { locations, filter } = store.getSnapshot();
  const listed = locations.filter((location) => isListed(location, filter));
  expect(radios).toHaveLength(listed.length + 1);
  expect(choiceIn(root, "Fit all").checked).toBe(true);

  choiceIn(root, "Milan").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("milan");

  const fits = adapter.callsOf("setView").length;
  choiceIn(root, "Fit all").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBeUndefined();
  await expect.poll(() => adapter.callsOf("setView").length).toBeGreaterThan(fits);
  expect(adapter.callsOf("setView").at(-1)?.view.kind).toBe("fit-bounds");

  adapter.probe().click("rome");
  await expect.poll(() => choiceIn(root, "Rome").checked).toBe(true);
  expect(choiceIn(root, "Fit all").checked).toBe(false);
};
