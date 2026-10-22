// A page using maplace on MapLibre, type-checked against the packed package
// (scripts/checks/consumer-types.ts): MapLibre's types come from the maplibre-gl it installed.

import { createMaplace } from "maplace";
import {
  createMapLibreAdapter,
  createMapLibreMap,
  type MapLibreAdapterOptions,
} from "maplace/maplibre";
import "maplace/element/maplibre";
import { Map as MapLibreMap } from "maplibre-gl";

const pageMap = new MapLibreMap({ container: "map" });
const options: MapLibreAdapterOptions = { map: pageMap };
const maplace = createMaplace({ locations: [{ id: "rome", lat: 41.9, lng: 12.5 }] });
maplace.attach(createMapLibreAdapter(options), pageMap.getContainer());
createMapLibreMap("#map", { mapStyle: "https://tiles.example/style.json", list: true }).destroy();
createMapLibreMap("#map").destroy();
document.createElement("maplace-map").release();
