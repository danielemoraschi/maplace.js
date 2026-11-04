import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace, type Location, listedLocations, type Maplace } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";

const locations: Location[] = [
  venue("national-theatre", 51.507, -0.1145, "National Theatre", "Theatre"),
  venue("globe", 51.5081, -0.0972, "Shakespeare's Globe", "Theatre"),
  venue("donmar", 51.5136, -0.1254, "Donmar Warehouse", "Theatre"),
  venue("royal-albert-hall", 51.501, -0.1774, "Royal Albert Hall", "Concerts"),
  venue("wigmore-hall", 51.5165, -0.149, "Wigmore Hall", "Concerts"),
  venue("barbican", 51.5202, -0.0938, "Barbican Hall", "Concerts"),
  venue("borough-market", 51.5055, -0.091, "Borough Market", "Markets"),
  venue("camden-market", 51.5413, -0.146, "Camden Market", "Markets"),
  venue("spitalfields", 51.5197, -0.0754, "Old Spitalfields Market", "Markets"),
  venue("british-library", 51.5299, -0.1277, "British Library", "Talks"),
  venue("conway-hall", 51.5203, -0.1188, "Conway Hall", "Talks"),
  venue("royal-institution", 51.5098, -0.1425, "Royal Institution", "Talks"),
];

/** Every venue fitted, with room at the edges for the count and the legend over the map. */
const maplace = createMaplace({ locations, view: { kind: "fit-all", padding: 80 } });
const adapter = createMapLibreAdapter({
  mapStyle: "https://tiles.openfreemap.org/styles/liberty",
});
maplace.attach(adapter, "#whats-on-maplibre-vanilla-map");
adapter.mountControl(eventLegend(maplace), "bottom-left");
adapter.mountControl(eventStatus(maplace), "top-left");

/** A venue in its category, its pin coloured by it. */
function venue(id: string, lat: number, lng: number, title: string, group: string): Location {
  return { id, lat, lng, title, group, icon: pinFor(group) };
}

/** A pin of your own, its colour the category's (`--category`, by `data-category` in the CSS). */
function pinFor(category: string): HTMLElement {
  const pin = document.createElement("span");
  pin.className = "pin";
  pin.dataset.category = category;
  return pin;
}

/** The count, and beside it the name of the venue selected, if any. */
function eventStatus(maplace: Maplace): HTMLElement {
  const status = document.createElement("div");
  status.className = "event-status";
  status.append(eventCount(maplace), selectedName(maplace));
  return status;
}

/** How many venues are shown, of all of them, said again when that changes. */
function eventCount(maplace: Maplace): HTMLOutputElement {
  const count = document.createElement("output");
  count.className = "event-count";
  const writeCount = () => {
    const snapshot = maplace.getSnapshot();
    const shown = listedLocations(snapshot).length;
    const total = snapshot.locations.length;
    const text = shown === total ? `${total} venues` : `${shown} of ${total} venues`;
    if (count.textContent !== text) count.textContent = text;
  };
  writeCount();
  maplace.subscribe(writeCount);
  return count;
}

/**
 * The name of the venue selected, marked with its category for its colour; hidden while none is.
 * Not a live region: maplace says each selection to a screen reader already.
 */
function selectedName(maplace: Maplace): HTMLElement {
  const name = document.createElement("span");
  name.className = "event-selected";
  const writeName = (id: string | undefined) => {
    const selected = maplace.getSnapshot().locations.find((location) => location.id === id);
    name.hidden = selected === undefined;
    name.textContent = selected?.title ?? "";
    name.dataset.category = selected?.group ?? "";
  };
  writeName(maplace.getSnapshot().selectedId);
  maplace.on("selectionChange", ({ id }) => writeName(id));
  return name;
}

/**
 * A chip per category, in the venues' order; the one shown alone is pressed. The chips are made
 * once, so a chip pressed from the keyboard keeps its focus; a store change only moves the press.
 */
function eventLegend(maplace: Maplace): HTMLElement {
  const legend = document.createElement("fieldset");
  legend.className = "event-legend";
  legend.setAttribute("aria-label", "Categories");
  const categories = new Set(maplace.getSnapshot().locations.flatMap(({ group }) => group ?? []));
  const chips = [...categories].map((category) => categoryChip(maplace, category));
  legend.append(...chips);
  let pressed: string | undefined;
  const pressShownAlone = () => {
    const alone = shownAlone(maplace);
    if (alone === pressed) return;
    pressed = alone;
    for (const chip of chips) {
      chip.setAttribute("aria-pressed", String(chip.dataset.category === alone));
    }
  };
  pressShownAlone();
  maplace.subscribe(pressShownAlone);
  return legend;
}

/** A toggle showing `category` alone, or every category again once pressed. */
function categoryChip(maplace: Maplace, category: string): HTMLButtonElement {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "category-chip";
  chip.dataset.category = category;
  chip.setAttribute("aria-pressed", "false");
  chip.textContent = category;
  chip.addEventListener("click", () => {
    maplace.setFilter(shownAlone(maplace) === category ? undefined : [category]);
  });
  return chip;
}

/** The category the map shows alone, if any. */
function shownAlone(maplace: Maplace): string | undefined {
  const groups = maplace.getSnapshot().filter?.groups;
  return groups?.length === 1 ? groups[0] : undefined;
}
