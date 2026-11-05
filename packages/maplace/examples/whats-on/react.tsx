import { type Location, listedLocations, type Snapshot, type View } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MapControl, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

/** What the card beside the map says of a venue, besides its name and category. */
interface VenueDetails {
  address: string;
  since: number;
  knownFor: string;
}

const venues: Location<VenueDetails>[] = [
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

/** A venue in its category, with what the card says of it. */
function venue(
  id: string,
  lat: number,
  lng: number,
  title: string,
  group: string,
  data: VenueDetails,
): Location<VenueDetails> {
  return { id, lat, lng, title, group, data };
}

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

/** The count, and beside it the name of the venue selected, if any. */
function EventStatus() {
  return (
    <div className="event-status">
      <EventCount />
      <SelectedName />
    </div>
  );
}

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
 * The name of the venue selected, marked with its category for its colour; hidden while none is.
 * Not a live region: maplace says each selection to a screen reader already.
 */
function SelectedName() {
  const maplace = useMaplace<VenueDetails>();
  const selected = useSyncExternalStore(maplace.subscribe, () => selectedIn(maplace.getSnapshot()));
  return (
    <span
      className="event-selected"
      data-category={selected?.group}
      hidden={selected === undefined}
    >
      {selected?.title}
    </span>
  );
}

function selectedIn({
  locations,
  selectedId,
}: Snapshot<VenueDetails>): Location<VenueDetails> | undefined {
  return locations.find(({ id }) => id === selectedId);
}

/**
 * The card beside the map: the venue selected, its category marked for its colour, with a × closing
 * it; or, while none is, the venues shown, each a button selecting it, under the category shown
 * alone, if any. A press moves the focus to what takes the button's place, the card rendered at
 * once for it. Not a live region: maplace says each selection to a screen reader already.
 */
function VenueCard() {
  const maplace = useMaplace<VenueDetails>();
  const selected = useSyncExternalStore(maplace.subscribe, () => selectedIn(maplace.getSnapshot()));
  const listed = useListedVenues();
  const shownAlone = useSyncExternalStore(maplace.subscribe, () =>
    shownAloneIn(maplace.getSnapshot()),
  );
  const card = useRef<HTMLElement>(null);
  const selectAndFocus = (id: string | undefined, toFocus: string) => {
    flushSync(() => maplace.select(id));
    card.current?.querySelector<HTMLElement>(toFocus)?.focus();
  };
  return (
    <aside className="venue-card" aria-label="Venue" ref={card}>
      {selected?.data === undefined ? (
        <div className="venue-picker">
          <p
            className="venue-list-category"
            data-category={shownAlone}
            hidden={shownAlone === undefined}
          >
            {shownAlone}
          </p>
          <p className="venue-empty">Pick a venue on the map, or here.</p>
          <ul className="venue-list" aria-label="Venues">
            {listed.map(({ id, title, group }) => (
              <li key={id}>
                <button
                  type="button"
                  className="venue-pick"
                  data-category={group}
                  data-id={id}
                  onClick={() => selectAndFocus(id, ".venue-close")}
                >
                  {title ?? id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="venue" data-category={selected.group}>
          <button
            type="button"
            className="venue-close"
            aria-label="Close"
            onClick={() =>
              selectAndFocus(undefined, `.venue-pick[data-id="${CSS.escape(selected.id)}"]`)
            }
          />
          <p className="venue-category">{selected.group}</p>
          <h3 className="venue-name">{selected.title}</h3>
          <dl>
            <div>
              <dt>Address</dt>
              <dd className="venue-address">{selected.data.address}</dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd className="venue-since">{selected.data.since}</dd>
            </div>
            <div>
              <dt>Known for</dt>
              <dd className="venue-known-for">{selected.data.knownFor}</dd>
            </div>
          </dl>
        </div>
      )}
    </aside>
  );
}

/** The venues shown, rendered again when they change; read as their ids, so a hover renders none. */
function useListedVenues(): readonly Location[] {
  const maplace = useMaplace();
  useSyncExternalStore(maplace.subscribe, () =>
    listedLocations(maplace.getSnapshot())
      .map(({ id }) => id)
      .join(),
  );
  return listedLocations(maplace.getSnapshot());
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
          <EventStatus />
        </MapControl>
      </MaplaceMap>
      <VenueCard />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("whats-on-react-root") as HTMLElement).render(
  <StrictMode>
    <WhatsOn />
  </StrictMode>,
);
