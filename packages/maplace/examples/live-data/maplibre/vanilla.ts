import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

const maplace = createMapLibreMap("#live-data-maplibre-vanilla-map", {
  list: { container: "#live-data-maplibre-vanilla-list" },
});

let latestGroup: string | undefined;

const buttons = document.querySelectorAll<HTMLButtonElement>(
  "#live-data-maplibre-vanilla-groups button",
);
for (const button of buttons) {
  button.addEventListener("click", () => showGroup(button.value));
}
await showGroup("a");

/**
 * One of the data sets swapped in. Only the group last asked for: a slower answer to an earlier
 * click is dropped.
 */
async function showGroup(letter: string): Promise<void> {
  latestGroup = letter;
  for (const button of buttons)
    button.setAttribute("aria-pressed", String(button.value === letter));
  const response = await fetch(`/examples/data/live-data-${letter}.json`);
  const locations: Location[] = await response.json();
  if (letter !== latestGroup) return;
  maplace.setLocations(locations);
  maplace.fitAll();
}
