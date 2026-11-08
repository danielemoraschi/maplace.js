import type { Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

const PLACE = "place-vanilla";
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

/** The line under the map: a link opening on the place `id`, on this map, or a prompt for one. */
function showLink(id: string | undefined): void {
  const line = document.getElementById("link-to-place-vanilla-link") as HTMLElement;
  if (id === undefined) {
    line.textContent = "Pick a place for a link to it.";
    return;
  }
  const address = new URL(location.href);
  address.searchParams.set(PLACE, id);
  address.hash = "link-to-place-vanilla-map";
  const link = document.createElement("a");
  link.href = address.href;
  link.textContent = address.search;
  line.replaceChildren("Link to this place: ", link);
}

const maplace = createGoogleMap("#link-to-place-vanilla-map", {
  locations,
  selectedId: placeInAddress(),
  list: { container: "#link-to-place-vanilla-list", fitAll: true, fitAllLabel: "View all" },
});
showLink(maplace.getSnapshot().selectedId);
maplace.on("selectionChange", (change) => {
  writeAddress(change);
  showLink(change.id);
});
// Only on a change: selecting the selected place again would pan back to it.
addEventListener("popstate", () => {
  const place = placeInAddress();
  if (place !== maplace.getSnapshot().selectedId) maplace.select(place);
});
