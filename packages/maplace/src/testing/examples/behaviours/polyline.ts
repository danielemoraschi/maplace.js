import { expect } from "vitest";
import { type ExampleBehaviour, listIn } from "./reading";

const POINTS_OF_INTEREST = ["lighthouse", "chapel", "lookout"];

const EDITED = {
  type: "polyline",
  path: [
    { lat: 44.1, lng: 9.72 },
    { lat: 44.12, lng: 9.7 },
    { lat: 44.14, lng: 9.65 },
  ],
} as const;

export const polyline: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  for (const id of POINTS_OF_INTEREST) expect(probe.location(id), id).toBeDefined();
  for (const title of ["Lighthouse", "Chapel", "Lookout", "Coast trail"]) {
    expect(listIn(root)?.textContent).toContain(title);
  }
  probe.click("chapel");
  await probe.settle();
  await expect
    .poll(() => probe.shownPopup()?.element.textContent)
    .toContain("A chapel above the sea.");
  probe.drag("trail", EDITED);
  await expect
    .poll(() => store.getSnapshot().locations.find(({ id }) => id === "trail"))
    .toMatchObject({ path: EDITED.path });
};
