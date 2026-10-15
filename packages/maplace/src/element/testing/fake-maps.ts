import { nextTask } from "../../adapter-kit/chunks";
import type { MaplaceError } from "../../index";
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
  const adapter = adaptersMade[adaptersMade.length - 1];
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

/** The errors `map` dispatches as `maplace-error`, from now on. */
export function errorsOn(map: MaplaceMapElement): MaplaceError[] {
  const errors: MaplaceError[] = [];
  map.addEventListener("maplace-error", (event) => {
    errors.push((event as CustomEvent<{ error: MaplaceError }>).detail.error);
  });
  return errors;
}

export { nextTask };

export const ROME =
  '<maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>';
export const MILAN =
  '<maplace-location location-id="milan" lat="45.46" lng="9.19" title="Milan"></maplace-location>';
