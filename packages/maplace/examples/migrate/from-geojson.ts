// Locations from a GeoJSON file: its Points, LineStrings and Polygons, each feature's id its own.
import { locationsFromGeoJSON, type Maplace } from "maplace";

declare const maplace: Maplace; // your store, e.g. from createGoogleMap or createMapLibreMap

const response = await fetch("/places.geojson");
maplace.setLocations(locationsFromGeoJSON(await response.json()));
