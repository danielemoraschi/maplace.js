import { createGoogleMap } from "@maplacejs/maplace/google";

const maplace = createGoogleMap("#menu-vanilla-map", {
  locations: [
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London", group: "South" },
    { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", group: "North" },
    { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast", group: "North" },
  ],
  list: { as: "select", heading: "Choose a location:", fitAll: true, fitAllLabel: "All cities" },
});

const northOnly = document.querySelector<HTMLInputElement>("#menu-vanilla-north-only");
northOnly?.addEventListener("change", () => {
  maplace.setFilter(northOnly.checked ? ["North"] : undefined);
});
