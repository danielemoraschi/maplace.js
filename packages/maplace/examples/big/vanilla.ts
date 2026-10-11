import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const maplace = createMaplace({ cluster: true });
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
