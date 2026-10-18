import { createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace({
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
const container = document.getElementById("simple-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
