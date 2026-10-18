import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace();
const container = document.getElementById("mixed-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("mixed-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);

const response = await fetch("/locations.json");
const locations: Location[] = await response.json();
maplace.setLocations(locations);
