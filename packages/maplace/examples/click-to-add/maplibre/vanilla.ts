import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

const maplace = createMapLibreMap("#click-to-add-maplibre-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", editable: true },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", editable: true },
  ],
});

let pins = 0;
maplace.on("mapClick", ({ position }) => {
  pins += 1;
  const pin = { id: `pin-${pins}`, ...position, title: `Pin ${pins}`, editable: true };
  maplace.setLocations([...maplace.getSnapshot().locations, pin]);
});
