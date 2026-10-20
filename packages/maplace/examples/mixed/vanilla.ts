import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#mixed-vanilla-map", {
  list: { container: "#mixed-vanilla-list" },
});

let latestGroup: string | undefined;

const buttons = document.querySelectorAll<HTMLButtonElement>("#mixed-vanilla-groups button");
for (const button of buttons) {
  button.addEventListener("click", () => showGroup(button.value));
}
await showGroup("a");

/**
 * One of the data sets swapped in, group C with a route through it; leaving C takes it away.
 * Only the group last asked for: a slower answer to an earlier click is dropped.
 */
async function showGroup(letter: string): Promise<void> {
  latestGroup = letter;
  const response = await fetch(`/mixed-${letter}.json`);
  const locations: Location[] = await response.json();
  if (letter !== latestGroup) return;
  maplace.setLocations(locations);
  if (letter === "c") {
    maplace.setRoute({ stops: locations.map(({ id }) => id), travelMode: "driving" });
  }
  maplace.fitAll();
}
