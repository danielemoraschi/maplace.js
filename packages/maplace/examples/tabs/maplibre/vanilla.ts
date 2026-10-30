import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

const notes: Readonly<Record<string, string>> = {
  rome: "Capital since 1871.",
  milan: "Finance and fashion.",
};
const maplace = createMapLibreMap("#tabs-maplibre-vanilla-map", {
  selectedId: "rome",
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", zoom: 6 },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", zoom: 6 },
  ],
  list: { container: "#tabs-maplibre-vanilla-list" },
});

const details = document.querySelector("#tabs-maplibre-vanilla-details");
showNote(maplace.getSnapshot().selectedId);
maplace.on("selectionChange", ({ id }) => showNote(id));

/** The chosen tab's details, in the panel below the tabs. */
function showNote(id: string | undefined): void {
  if (details) details.textContent = id === undefined ? "" : (notes[id] ?? "");
}
