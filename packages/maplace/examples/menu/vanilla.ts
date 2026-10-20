import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#menu-vanilla-map", {
  mapId: "DEMO_MAP_ID",
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
  ],
  list: { as: "select", heading: "Choose a location:", fitAllLabel: "All cities" },
});

const northOnly = document.querySelector<HTMLInputElement>("#menu-vanilla-north-only");
northOnly?.addEventListener("change", () => {
  maplace.setFilter(northOnly.checked ? ["North"] : undefined);
});
