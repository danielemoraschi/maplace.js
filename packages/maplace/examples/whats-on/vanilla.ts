import { createMaplace, type Location, listedLocations, type Maplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

/** What the card beside the map says of a venue, besides its name and category. */
interface VenueDetails {
  address: string;
  since: number;
  knownFor: string;
}

const locations: Location<VenueDetails>[] = [
  venue("national-theatre", 51.507, -0.1145, "National Theatre", "Theatre", {
    address: "Upper Ground, London SE1 9PX",
    since: 1976,
    knownFor: "Three stages on the South Bank",
  }),
  venue("globe", 51.5081, -0.0972, "Shakespeare's Globe", "Theatre", {
    address: "21 New Globe Walk, London SE1 9DT",
    since: 1997,
    knownFor: "An open-air playhouse rebuilt after the 1599 original",
  }),
  venue("donmar", 51.5136, -0.1254, "Donmar Warehouse", "Theatre", {
    address: "41 Earlham Street, London WC2H 9LX",
    since: 1977,
    knownFor: "A small studio theatre in Covent Garden",
  }),
  venue("royal-albert-hall", 51.501, -0.1774, "Royal Albert Hall", "Concerts", {
    address: "Kensington Gore, London SW7 2AP",
    since: 1871,
    knownFor: "The BBC Proms, every summer",
  }),
  venue("wigmore-hall", 51.5165, -0.149, "Wigmore Hall", "Concerts", {
    address: "36 Wigmore Street, London W1U 2BP",
    since: 1901,
    knownFor: "Chamber music and song recitals",
  }),
  venue("barbican", 51.5202, -0.0938, "Barbican Hall", "Concerts", {
    address: "Silk Street, London EC2Y 8DS",
    since: 1982,
    knownFor: "Home of the London Symphony Orchestra",
  }),
  venue("borough-market", 51.5055, -0.091, "Borough Market", "Markets", {
    address: "8 Southwark Street, London SE1 1TL",
    since: 1756,
    knownFor: "One of London's oldest food markets",
  }),
  venue("camden-market", 51.5413, -0.146, "Camden Market", "Markets", {
    address: "Camden Lock Place, London NW1 8AF",
    since: 1974,
    knownFor: "Stalls along the Regent's Canal",
  }),
  venue("spitalfields", 51.5197, -0.0754, "Old Spitalfields Market", "Markets", {
    address: "16 Horner Square, London E1 6EW",
    since: 1638,
    knownFor: "A Victorian market hall in the East End",
  }),
  venue("british-library", 51.5299, -0.1277, "British Library", "Talks", {
    address: "96 Euston Road, London NW1 2DB",
    since: 1973,
    knownFor: "The UK's national library, at St Pancras",
  }),
  venue("conway-hall", 51.5203, -0.1188, "Conway Hall", "Talks", {
    address: "25 Red Lion Square, London WC1R 4RL",
    since: 1929,
    knownFor: "Talks and debates, home of the Conway Hall Ethical Society",
  }),
  venue("royal-institution", 51.5098, -0.1425, "Royal Institution", "Talks", {
    address: "21 Albemarle Street, London W1S 4BS",
    since: 1799,
    knownFor: "The Christmas Lectures, given since 1825",
  }),
];

/** Every venue fitted, with room at the edges for the count and the legend over the map. */
const maplace = createMaplace({ locations, view: { kind: "fit-all", padding: 80 } });
const adapter = createGoogleAdapter({
  mapOptions: { mapTypeControl: false, streetViewControl: false, cameraControl: false },
});
maplace.attach(adapter, "#whats-on-vanilla-map");
adapter.mountControl(eventLegend(maplace), "bottom-left");
adapter.mountControl(eventStatus(maplace), "top-left");
showVenueIn(document.querySelector("#whats-on-vanilla-card") as HTMLElement, maplace);

/** A venue in its category, its pin coloured by it, with what the card says of it. */
function venue(
  id: string,
  lat: number,
  lng: number,
  title: string,
  group: string,
  data: VenueDetails,
): Location<VenueDetails> {
  return { id, lat, lng, title, group, data, icon: pinFor(group) };
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
 * Not a live region: Maplace.js says each selection to a screen reader already.
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
 * The card beside the map: the venue selected, its category marked for its colour, made from the
 * card's template and in the card only while a venue is selected, with a × closing it; or,
 * while none is, the venues shown, each a button selecting it. Not a live region: Maplace.js says each
 * selection to a screen reader already.
 */
function showVenueIn(card: HTMLElement, maplace: Maplace<VenueDetails>): void {
  const picker = card.querySelector(".venue-picker") as HTMLElement;
  const template = card.querySelector("template") as HTMLTemplateElement;
  const venuePart = template.content.firstElementChild?.cloneNode(true) as HTMLElement;
  const close = venuePart.querySelector(".venue-close") as HTMLButtonElement;
  close.addEventListener("click", () => {
    const closed = maplace.getSnapshot().selectedId ?? "";
    maplace.select(undefined);
    picker.querySelector<HTMLElement>(`.venue-pick[data-id="${CSS.escape(closed)}"]`)?.focus();
  });
  listVenuesIn(picker, maplace, () => close.focus());
  const write = (selector: string, text: string) => {
    (venuePart.querySelector(selector) as HTMLElement).textContent = text;
  };
  const writeCard = (id: string | undefined) => {
    const selected = maplace.getSnapshot().locations.find((location) => location.id === id);
    const data = selected?.data;
    picker.hidden = data !== undefined;
    if (selected === undefined || data === undefined) {
      venuePart.remove();
      return;
    }
    venuePart.dataset.category = selected.group;
    write(".venue-category", selected.group ?? "");
    write(".venue-name", selected.title ?? "");
    write(".venue-address", data.address);
    write(".venue-since", String(data.since));
    write(".venue-known-for", data.knownFor);
    if (!venuePart.isConnected) card.append(venuePart);
  };
  writeCard(maplace.getSnapshot().selectedId);
  maplace.on("selectionChange", ({ id }) => writeCard(id));
}

/**
 * In the card's `picker`, a button per venue shown, selecting it and then calling `afterPick`, and
 * above them the category shown alone, if any, marked for its colour; written again only when the
 * venues shown change, as a hover changes the store too.
 */
function listVenuesIn(picker: HTMLElement, maplace: Maplace, afterPick: () => void): void {
  const categoryLine = picker.querySelector(".venue-list-category") as HTMLElement;
  const list = picker.querySelector(".venue-list") as HTMLElement;
  let listedIds: string | undefined;
  const writeList = () => {
    const listed = listedLocations(maplace.getSnapshot());
    const ids = listed.map(({ id }) => id).join();
    if (ids === listedIds) return;
    listedIds = ids;
    const alone = shownAlone(maplace);
    categoryLine.hidden = alone === undefined;
    categoryLine.textContent = alone ?? "";
    categoryLine.dataset.category = alone ?? "";
    list.replaceChildren(...listed.map((location) => venueEntry(location, maplace, afterPick)));
  };
  writeList();
  maplace.subscribe(writeList);
}

/** A venue in the card's list: a button selecting it, marked with its category for its colour. */
function venueEntry({ id, title, group }: Location, maplace: Maplace, afterPick: () => void) {
  const pick = document.createElement("button");
  pick.type = "button";
  pick.className = "venue-pick";
  pick.dataset.category = group ?? "";
  pick.textContent = title ?? id;
  pick.dataset.id = id;
  pick.addEventListener("click", () => {
    maplace.select(id);
    afterPick();
  });
  const entry = document.createElement("li");
  entry.append(pick);
  return entry;
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
