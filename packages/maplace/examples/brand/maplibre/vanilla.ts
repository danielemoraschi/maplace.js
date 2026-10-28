import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

/**
 * The brand's palette on a delivery area, at rest, hovered and selected: hex colours, which every
 * provider reads (a CSS variable is the page's, not the map's).
 */
const AREA = {
  style: { stroke: "#3b2416", strokeWidth: 2, fill: "#c8a27a", fillOpacity: 0.3 },
  hoveredStyle: { stroke: "#23735a", strokeWidth: 3 },
  selectedStyle: { stroke: "#23735a", strokeWidth: 3, fill: "#23735a", fillOpacity: 0.4 },
};

const locations: Location[] = [
  {
    id: "north",
    type: "polygon",
    title: "North delivery area",
    path: [
      { lat: 55.697, lng: 12.548 },
      { lat: 55.697, lng: 12.598 },
      { lat: 55.684, lng: 12.598 },
      { lat: 55.684, lng: 12.548 },
    ],
    ...AREA,
  },
  {
    id: "south",
    type: "polygon",
    title: "South delivery area",
    path: [
      { lat: 55.677, lng: 12.548 },
      { lat: 55.677, lng: 12.6 },
      { lat: 55.658, lng: 12.6 },
      { lat: 55.658, lng: 12.548 },
    ],
    ...AREA,
  },
  { id: "stroget", lat: 55.6784, lng: 12.5755, title: "Kaffa Strøget" },
  { id: "amagertorv", lat: 55.6786, lng: 12.579, title: "Kaffa Amagertorv" },
  { id: "kobmagergade", lat: 55.6807, lng: 12.5773, title: "Kaffa Købmagergade" },
  { id: "gammeltorv", lat: 55.6775, lng: 12.5725, title: "Kaffa Gammeltorv" },
  { id: "nikolaj", lat: 55.6789, lng: 12.5822, title: "Kaffa Nikolaj" },
  { id: "christianshavn", lat: 55.6729, lng: 12.5935, title: "Kaffa Christianshavn" },
  { id: "torvegade", lat: 55.672, lng: 12.591, title: "Kaffa Torvegade" },
  { id: "overgaden", lat: 55.6735, lng: 12.596, title: "Kaffa Overgaden" },
  { id: "vesterbro", lat: 55.6704, lng: 12.556, title: "Kaffa Vesterbro" },
  { id: "norrebro", lat: 55.692, lng: 12.556, title: "Kaffa Nørrebro" },
];

createMapLibreMap("#brand-maplibre-vanilla-map", {
  locations,
  cluster: true,
  list: { container: "#brand-maplibre-vanilla-list" },
});
