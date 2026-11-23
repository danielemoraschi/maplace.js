import { type ListEntry, type Location, locationsFromGeoJSON } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

/** What a country's shape and badge carry: its share, and the colour it is drawn in. */
interface CountryShare {
  readonly share: number;
  readonly colour: string;
}

// Each country's share, the colour it is drawn in, and where its badge sits. The shares are
// made up, for the example.
const SHARES = [
  { id: "USA", share: 30, colour: "#1d4ed8", badge: { lat: 33, lng: -98 } },
  { id: "IND", share: 20, colour: "#c2410c", badge: { lat: 16, lng: 78 } },
  { id: "GBR", share: 20, colour: "#15803d", badge: { lat: 51, lng: -1.5 } },
  { id: "BRA", share: 10, colour: "#6d28d9", badge: { lat: -16, lng: -52 } },
  { id: "SAU", share: 10, colour: "#b45309", badge: { lat: 19, lng: 45 } },
  { id: "AUS", share: 10, colour: "#be185d", badge: { lat: -31, lng: 134 } },
];

function span(className: string, ...children: (Node | string)[]): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  element.append(...children);
  return element;
}

/** A country's share on the map: the figure in a ring of its colour. */
function badgeIcon({ data }: Location<CountryShare>): HTMLElement {
  const badge = span("share-badge", `${data?.share}%`);
  badge.style.setProperty("--colour", data?.colour ?? "");
  return badge;
}

/** A country in the list: its name with its colour's swatch and its share, then ten dots, the share filled in. */
function shareEntry({ location }: ListEntry<CountryShare>): Node {
  const { share = 0, colour = "" } = location.data ?? {};
  const dots = span("share-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let tenth = 0; tenth < 10; tenth++) {
    const dot = span("share-dot");
    dot.toggleAttribute("data-filled", tenth < share / 10);
    dots.append(dot);
  }
  const entry = span(
    "share-entry",
    span("share-head", span("share-name", location.title ?? ""), span("share-figure", `${share}%`)),
    dots,
  );
  entry.style.setProperty("--colour", colour);
  return entry;
}

const maplace = createGoogleMap<CountryShare>("#share-by-country-vanilla-map", {
  view: { kind: "fit-all", padding: 48 },
  list: {
    container: "#share-by-country-vanilla-list",
    heading: "Share by country",
    fitAll: true,
    fitAllLabel: "All countries",
    render: shareEntry,
  },
});

const countries = locationsFromGeoJSON(await (await fetch("/examples/data/countries.json")).json());

/** Each country in its colour, then its badge: in `SHARES`' order, so the list is too. */
const locations = SHARES.flatMap(({ id, share, colour, badge }): Location<CountryShare>[] => {
  const country = countries.find((location) => location.id === id);
  if (country?.type !== "polygon" && country?.type !== "multipolygon") {
    throw new Error(`countries.json has no ${id} to shade`);
  }
  const data = { share, colour };
  return [
    {
      ...country,
      data,
      style: { fill: colour, fillOpacity: 0.85, stroke: "#ffffff", strokeWidth: 1 },
      hoveredStyle: { fillOpacity: 1 },
      selectedStyle: { fillOpacity: 1, stroke: "#111827", strokeWidth: 2 },
    },
    {
      id: `${id}-badge`,
      title: `${country.title}: ${share}%`,
      ...badge,
      listed: false,
      data,
      icon: badgeIcon,
    },
  ];
});

maplace.setLocations(locations);

// A click on a badge selects its country, as a click on its entry does.
maplace.on("selectionChange", ({ id }) => {
  if (id?.endsWith("-badge")) maplace.select(id.replace(/-badge$/, ""));
});
