import { createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const maplace = createMaplace({
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
