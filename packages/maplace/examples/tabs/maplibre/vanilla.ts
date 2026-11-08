import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

const notes: Readonly<Record<string, string>> = {
  london: "Capital of the United Kingdom.",
  edinburgh: "Capital of Scotland, home of the Fringe arts festival.",
};
const maplace = createMapLibreMap("#tabs-maplibre-vanilla-map", {
  selectedId: "london",
  locations: [
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London", zoom: 6 },
    { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", zoom: 6 },
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
