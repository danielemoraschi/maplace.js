import { expect } from "vitest";
import { type ExampleBehaviour, listIn } from "./reading";

const POINTS_OF_INTEREST = ["manarola", "corniglia", "vernazza"];

const EDITED = {
  type: "polyline",
  path: [
    { lat: 44.0996, lng: 9.7377 },
    { lat: 44.1066, lng: 9.7285 },
    { lat: 44.122, lng: 9.716 },
    { lat: 44.1348, lng: 9.6847 },
    { lat: 44.1462, lng: 9.6548 },
  ],
} as const;

export const polyline: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  for (const id of POINTS_OF_INTEREST) expect(probe.location(id), id).toBeDefined();
  for (const title of ["Manarola", "Corniglia", "Vernazza", "Sentiero Azzurro"]) {
    expect(listIn(root)?.textContent).toContain(title);
  }
  probe.click("corniglia");
  await probe.settle();
  await expect
    .poll(() => probe.shownPopup()?.element.textContent)
    .toContain("The village on the cliff top.");
  probe.drag("trail", EDITED);
  await expect
    .poll(() => store.getSnapshot().locations.find(({ id }) => id === "trail"))
    .toMatchObject({ path: EDITED.path });
};
