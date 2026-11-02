// A map of your own on MapLibre: the page makes it, and maplacejs draws on it.
import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { Map as MapLibreMap } from "maplibre-gl";

const map = new MapLibreMap({
  container: "own-map",
  style: "https://tiles.openfreemap.org/styles/bright",
  center: [12.4964, 41.9028],
  zoom: 5,
});

const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
});
maplace.attach(createMapLibreAdapter({ map }), map.getContainer());

// A map event maplacejs doesn't report: a right-click measures distances from there.
map.on("contextmenu", ({ lngLat: { lat, lng } }) => maplace.setOrigin({ lat, lng }));
