import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace();
const container = document.getElementById("mixed-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("mixed-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);

let latestGroup: string | undefined;

/**
 * One of 0.2's data sets swapped in, group C with a route through it; leaving C takes it away.
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

const buttons = document.querySelectorAll<HTMLButtonElement>("#mixed-vanilla-groups button");
for (const button of buttons) {
  button.addEventListener("click", () => showGroup(button.value));
}
await showGroup("a");
