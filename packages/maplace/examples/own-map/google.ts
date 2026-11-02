// A map of your own on Google: the page loads Maps JS and makes it, and maplacejs draws on it.
import { createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const { Map: GoogleMap } = await google.maps.importLibrary("maps");
const map = new GoogleMap(document.querySelector("#own-map") as HTMLElement, {
  mapId: "YOUR_MAP_ID",
  center: { lat: 41.9028, lng: 12.4964 },
  zoom: 5,
});

const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
});
maplace.attach(createGoogleAdapter({ map }), map.getDiv());

// A map event maplacejs doesn't report: a right-click measures distances from there.
map.addListener("contextmenu", ({ latLng }: google.maps.MapMouseEvent) => {
  if (latLng) maplace.setOrigin(latLng.toJSON());
});
