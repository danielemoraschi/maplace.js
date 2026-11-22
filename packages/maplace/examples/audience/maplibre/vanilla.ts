import "maplibre-gl/dist/maplibre-gl.css";
import type { ListEntry, Location } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

type Period = "1M" | "3M" | "1Y";

/** A region as the file has it: its top genre, and its viewers in each period. */
interface RegionRow {
  readonly id: string;
  readonly title: string;
  readonly lat: number;
  readonly lng: number;
  readonly genre: string;
  readonly viewers: Readonly<Record<Period, number>>;
}

/** The file: the studio the arcs leave from, and the regions. */
interface AudienceFile {
  readonly studio: { readonly title: string; readonly lat: number; readonly lng: number };
  readonly regions: readonly RegionRow[];
}

/** What a region's card and entry show for the period chosen. */
interface RegionFigures {
  readonly genre: string;
  readonly viewers: number;
  readonly share: number;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en");

function span(className: string, ...children: (Node | string)[]): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  element.append(...children);
  return element;
}

/** A region on the map: its genre's letter, the genre, and its viewers. */
function regionCard({ data }: Location<RegionFigures>): HTMLElement {
  const genre = data?.genre ?? "";
  const card = span(
    "audience-card",
    span("audience-badge", genre.charAt(0)),
    span(
      "audience-card-text",
      span("audience-genre", genre),
      span("audience-viewers", compact.format(data?.viewers ?? 0)),
    ),
  );
  card.dataset.genre = genre;
  return card;
}

/** A region in the list: its name, genre, viewers and share, and a bar as long as the share. */
function regionEntry({ location }: ListEntry<RegionFigures>): Node {
  const { genre = "", viewers = 0, share = 0 } = location.data ?? {};
  const bar = span("audience-bar");
  bar.setAttribute("aria-hidden", "true");
  bar.style.width = `${share}%`;
  const entry = span(
    "audience-entry",
    span("audience-entry-title", location.title ?? ""),
    span("audience-entry-detail", `${genre} · ${compact.format(viewers)} · ${share}%`),
    bar,
  );
  entry.dataset.genre = genre;
  return entry;
}

const maplace = createMapLibreMap<RegionFigures>("#audience-maplibre-vanilla-map", {
  // Every region in view, with room at the edges for the cards.
  view: { kind: "fit-all", padding: 64 },
  list: { container: "#audience-maplibre-vanilla-list", heading: "By region", render: regionEntry },
});

const audience: AudienceFile = await (await fetch("/examples/data/audience.json")).json();
/** Every region's viewers in `period`, added up. */
function totalFor(period: Period): number {
  return audience.regions.reduce((sum, { viewers }) => sum + viewers[period], 0);
}

/** Each region with its figures for `period`, an arc to it from the studio, and the studio. */
function locationsFor(period: Period): Location<RegionFigures>[] {
  const { studio, regions } = audience;
  const total = totalFor(period);
  return [
    ...regions.map(({ id, title, lat, lng, genre, viewers }) => ({
      id,
      title,
      lat,
      lng,
      icon: regionCard,
      data: { genre, viewers: viewers[period], share: Math.round((viewers[period] / total) * 100) },
    })),
    ...regions.map(
      ({ id, title, lat, lng }): Location<RegionFigures> => ({
        id: `${id}-arc`,
        type: "polyline",
        title: `${studio.title} → ${title}`,
        path: [
          { lat: studio.lat, lng: studio.lng },
          { lat, lng },
        ],
        curve: 0.2,
        listed: false,
        style: { stroke: "#6d28d9", strokeWidth: 2, strokeOpacity: 0.7 },
      }),
    ),
    { id: "studio", ...studio, listed: false },
  ];
}

const total = document.querySelector<HTMLOutputElement>("#audience-maplibre-vanilla-total");
const period = document.querySelector<HTMLSelectElement>("#audience-maplibre-vanilla-period");
function showPeriod(): void {
  const chosen = (period?.value ?? "1Y") as Period;
  maplace.setLocations(locationsFor(chosen));
  if (total) total.value = whole.format(totalFor(chosen));
}
showPeriod();
period?.addEventListener("change", showPeriod);

// A click on an arc selects its region, as a click on the region's card does.
maplace.on("selectionChange", ({ id }) => {
  if (id?.endsWith("-arc")) maplace.select(id.replace(/-arc$/, ""));
});
