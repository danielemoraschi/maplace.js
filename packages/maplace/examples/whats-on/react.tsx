import { type Location, listedLocations, type Snapshot, type View } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MapControl, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const venues: Location[] = [
  {
    id: "national-theatre",
    lat: 51.507,
    lng: -0.1145,
    title: "National Theatre",
    group: "Theatre",
  },
  { id: "globe", lat: 51.5081, lng: -0.0972, title: "Shakespeare's Globe", group: "Theatre" },
  { id: "donmar", lat: 51.5136, lng: -0.1254, title: "Donmar Warehouse", group: "Theatre" },
  {
    id: "royal-albert-hall",
    lat: 51.501,
    lng: -0.1774,
    title: "Royal Albert Hall",
    group: "Concerts",
  },
  { id: "wigmore-hall", lat: 51.5165, lng: -0.149, title: "Wigmore Hall", group: "Concerts" },
  { id: "barbican", lat: 51.5202, lng: -0.0938, title: "Barbican Hall", group: "Concerts" },
  { id: "borough-market", lat: 51.5055, lng: -0.091, title: "Borough Market", group: "Markets" },
  { id: "camden-market", lat: 51.5413, lng: -0.146, title: "Camden Market", group: "Markets" },
  {
    id: "spitalfields",
    lat: 51.5197,
    lng: -0.0754,
    title: "Old Spitalfields Market",
    group: "Markets",
  },
  { id: "british-library", lat: 51.5299, lng: -0.1277, title: "British Library", group: "Talks" },
  { id: "conway-hall", lat: 51.5203, lng: -0.1188, title: "Conway Hall", group: "Talks" },
  {
    id: "royal-institution",
    lat: 51.5098,
    lng: -0.1425,
    title: "Royal Institution",
    group: "Talks",
  },
];

/**
 * Google's map without its map-type, camera and Street View controls: the count and the legend take
 * their place.
 */
const createAdapter = () =>
  createGoogleAdapter({
    mapOptions: { mapTypeControl: false, streetViewControl: false, cameraControl: false },
  });

/** Every venue fitted, with room at the edges for the count and the legend over the map. */
const firstView: View = { kind: "fit-all", padding: 80 };

/**
 * A pin of your own, its colour the category's (`--category`, by `data-category` in the CSS), in a
 * node maplace keeps for each marker and marks `data-hovered` and `data-selected`.
 */
const markerIcon = ({ group }: Location) => <span className="pin" data-category={group} />;

/** How many venues are shown, of all of them; read as text, so a hover renders nothing. */
function EventCount() {
  const maplace = useMaplace();
  const text = useSyncExternalStore(maplace.subscribe, () => countText(maplace.getSnapshot()));
  return <output className="event-count">{text}</output>;
}

function countText(snapshot: Snapshot): string {
  const shown = listedLocations(snapshot).length;
  const total = snapshot.locations.length;
  return shown === total ? `${total} venues` : `${shown} of ${total} venues`;
}

/**
 * A chip per category, in the venues' order, showing it alone, or every one again once pressed;
 * read from the locations and the category shown alone, so a hover renders nothing.
 */
function EventLegend() {
  const maplace = useMaplace();
  const locations = useSyncExternalStore(maplace.subscribe, () => maplace.getSnapshot().locations);
  const shownAlone = useSyncExternalStore(maplace.subscribe, () =>
    shownAloneIn(maplace.getSnapshot()),
  );
  const categories = new Set(locations.flatMap(({ group }) => group ?? []));
  return (
    <fieldset className="event-legend" aria-label="Categories">
      {[...categories].map((category) => (
        <button
          key={category}
          type="button"
          className="category-chip"
          data-category={category}
          aria-pressed={category === shownAlone}
          onClick={() => maplace.setFilter(category === shownAlone ? undefined : [category])}
        >
          {category}
        </button>
      ))}
    </fieldset>
  );
}

/** The category the map shows alone, if any. */
function shownAloneIn({ filter }: Snapshot): string | undefined {
  return filter?.groups?.length === 1 ? filter.groups[0] : undefined;
}

function WhatsOn() {
  return (
    <MaplaceProvider locations={venues} view={firstView}>
      <MaplaceMap createAdapter={createAdapter} className="map" markerIcon={markerIcon}>
        <MapControl position="bottom-left">
          <EventLegend />
        </MapControl>
        <MapControl position="top-left">
          <EventCount />
        </MapControl>
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("whats-on-react-root") as HTMLElement).render(
  <StrictMode>
    <WhatsOn />
  </StrictMode>,
);
