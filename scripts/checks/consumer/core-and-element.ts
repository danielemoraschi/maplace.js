// A page using maplace without Google, type-checked against the packed package
// (scripts/checks/consumer-types.ts): it needs no @types/google.maps.
import { createListView, createMaplace, type Location, MaplaceError } from "maplace";
import type { MaplaceElementEventMap } from "maplace/element";
import "maplace/element";

const cities: Location<{ population: number }>[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", data: { population: 2_750_000 } },
];
const maplace = createMaplace({ locations: cities });
maplace.on("select", ({ id }) => console.log(id));
document.body.append(createListView(maplace).element);

const map = document.querySelector("maplace-map");
const reportError = (event: MaplaceElementEventMap["maplace-error"]) =>
  console.log(event.detail.error.code, map?.loadState);
map?.addEventListener("maplace-error", reportError as EventListener);
try {
  maplace.select("nowhere");
} catch (error) {
  if (error instanceof MaplaceError && error.code === "unknown-id") console.log(error.message);
}
