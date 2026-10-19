// A page using maplace on Google, type-checked against the packed package
// (scripts/checks/consumer-types.ts): Google's types come in through maplace's references.
import { createMaplace } from "maplace";
import "maplace/element/google";
import { createGoogleAdapter, createGoogleMap, type GoogleAdapterOptions } from "maplace/google";

declare const pageMap: google.maps.Map;
const options: GoogleAdapterOptions = { mapId: "DEMO_MAP_ID", map: pageMap };
const maplace = createMaplace({ locations: [{ id: "rome", lat: 41.9, lng: 12.5 }] });
maplace.attach(createGoogleAdapter(options), pageMap.getDiv());
document.createElement("maplace-map").release();
createGoogleMap("#map", { mapId: "DEMO_MAP_ID", list: { position: "top-left" } }).destroy();
