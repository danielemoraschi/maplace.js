import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const maplace = createMaplace();
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);

const response = await fetch("/locations.json");
const locations: Location[] = await response.json();
maplace.setLocations(locations);
