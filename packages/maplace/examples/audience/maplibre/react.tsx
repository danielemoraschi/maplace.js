import "maplibre-gl/dist/maplibre-gl.css";
import type { ListEntry, Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

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

/** Every region in view, with room at the edges for the cards. */
const FIRST_VIEW = { kind: "fit-all", padding: 64 } as const;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en");

/** Every region's viewers in `period`, added up. */
function totalFor(audience: AudienceFile, period: Period): number {
  return audience.regions.reduce((sum, { viewers }) => sum + viewers[period], 0);
}

/** Each region with its figures for `period`, an arc to it from the studio, and the studio. */
function locationsFor(audience: AudienceFile, period: Period): Location<RegionFigures>[] {
  const { studio, regions } = audience;
  const total = totalFor(audience, period);
  return [
    ...regions.map(({ id, title, lat, lng, genre, viewers }) => ({
      id,
      title,
      lat,
      lng,
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

/** A region on the map: its genre's letter, the genre, and its viewers; the studio keeps its own. */
function markerIcon({ data }: Location<RegionFigures>) {
  if (data === undefined) return null;
  return (
    <span className="audience-card" data-genre={data.genre}>
      <span className="audience-badge">{data.genre.charAt(0)}</span>
      <span className="audience-card-text">
        <span className="audience-genre">{data.genre}</span>
        <span className="audience-viewers">{compact.format(data.viewers)}</span>
      </span>
    </span>
  );
}

/** A region in the list: its name and viewers, its genre and share, and the share as a bar on a track. */
const regionEntry = ({ location }: ListEntry<RegionFigures>) => {
  const { genre = "", viewers = 0, share = 0 } = location.data ?? {};
  return (
    <span className="audience-entry" data-genre={genre}>
      <span className="audience-entry-title">{location.title}</span>
      <span className="audience-entry-viewers">{compact.format(viewers)}</span>
      <span className="audience-entry-genre">{genre}</span>
      <span className="audience-entry-share">{share}%</span>
      <span className="audience-track" aria-hidden="true">
        <span className="audience-bar" style={{ width: `${share}%` }} />
      </span>
    </span>
  );
};

function Audience() {
  const [audience, setAudience] = useState<AudienceFile>();
  const [period, setPeriod] = useState<Period>("1Y");
  const [selectedId, setSelectedId] = useState<string>();
  useEffect(() => {
    fetch("/examples/data/audience.json")
      .then((response) => response.json())
      .then(setAudience);
  }, []);
  const locations = useMemo(
    () => (audience ? locationsFor(audience, period) : []),
    [audience, period],
  );
  return (
    <MaplaceProvider
      locations={locations}
      view={FIRST_VIEW}
      selectedId={selectedId}
      // A click on an arc selects its region, as a click on the region's card does.
      onSelectionChange={({ id }) => setSelectedId(id?.replace(/-arc$/, ""))}
    >
      <p>
        <label htmlFor="audience-maplibre-react-period">Period</label>{" "}
        <select
          id="audience-maplibre-react-period"
          value={period}
          onChange={(event) => setPeriod(event.target.value as Period)}
        >
          <option value="1M">Last month</option>
          <option value="3M">Last 3 months</option>
          <option value="1Y">Last year</option>
        </select>
      </p>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" markerIcon={markerIcon} />
        <LocationList heading="By region">{regionEntry}</LocationList>
      </div>
      <p>
        All viewers <output>{audience ? whole.format(totalFor(audience, period)) : ""}</output>
      </p>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("audience-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Audience />
  </StrictMode>,
);
