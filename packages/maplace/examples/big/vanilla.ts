import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace({ cluster: true });
const container = document.getElementById("big-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
