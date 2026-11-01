import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const PLACE = "place-react";
const locations: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin" },
];

/** The place the address names, if there is one: a link can name anything. */
function placeInAddress(): string | undefined {
  const id = new URLSearchParams(location.search).get(PLACE);
  return locations.find((place) => place.id === id)?.id;
}

/** A new history entry for a place picked, unless the address says so already. */
function writeAddress({ id }: { readonly id: string | undefined }): void {
  if (id === placeInAddress()) return;
  const address = new URL(location.href);
  if (id === undefined) address.searchParams.delete(PLACE);
  else address.searchParams.set(PLACE, id);
  history.pushState(null, "", address);
}

/** Back and forward select what the address names then. */
function FollowAddress() {
  const maplace = useMaplace();
  useEffect(() => {
    // Only on a change: selecting the selected place again would pan back to it.
    const follow = () => {
      const place = placeInAddress();
      if (place !== maplace.getSnapshot().selectedId) maplace.select(place);
    };
    addEventListener("popstate", follow);
    return () => removeEventListener("popstate", follow);
  }, [maplace]);
  return null;
}

/** The line under the map: a link opening on the place picked, on this map, or a prompt for one. */
function PlaceLink() {
  const maplace = useMaplace();
  const id = useSyncExternalStore(maplace.subscribe, () => maplace.getSnapshot().selectedId);
  if (id === undefined) return <p>Pick a place for a link to it.</p>;
  const address = new URL(location.href);
  address.searchParams.set(PLACE, id);
  address.hash = "link-to-place-react-root";
  return (
    <p>
      Link to this place: <a href={address.href}>{address.search}</a>
    </p>
  );
}

function LinkToPlace() {
  return (
    <MaplaceProvider
      locations={locations}
      defaultSelectedId={placeInAddress()}
      onSelectionChange={writeAddress}
    >
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        <LocationList fitAll fitAllLabel="View all" />
      </div>
      <PlaceLink />
      <FollowAddress />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("link-to-place-react-root") as HTMLElement).render(
  <StrictMode>
    <LinkToPlace />
  </StrictMode>,
);
