import { nextTask } from "../../adapter-kit/chunks";
import { createFakeAdapter, type FakeAdapter } from "../../testing/fake-adapter";
import { defineProvider, type MaplaceMapElement } from "../index";

/** Every adapter the `fake` provider made, in order. */
export const adaptersMade: FakeAdapter[] = [];

defineProvider("fake", () => {
  const adapter = createFakeAdapter();
  adaptersMade.push(adapter);
  return adapter;
});

/** The adapter the `fake` provider made last. */
export function lastAdapter(): FakeAdapter {
  const adapter = adaptersMade.at(-1);
  if (adapter === undefined) throw new Error("no map was opened");
  return adapter;
}

/** The page's body replaced by `html`, and its `<maplace-map>`, once it opened. */
export async function mapFrom(html: string): Promise<MaplaceMapElement> {
  document.body.innerHTML = html;
  await nextTask();
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no <maplace-map> in the html");
  return map;
}

export { nextTask } from "../../adapter-kit/chunks";
export { box, errorsOn, styledPage } from "./dom";

export const ROME =
  '<maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>';
export const MILAN =
  '<maplace-location location-id="milan" lat="45.46" lng="9.19" title="Milan"></maplace-location>';
