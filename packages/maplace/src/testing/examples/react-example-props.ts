import type { Location } from "../../location";
import { spreadPoints } from "./example-surroundings";

const CITIES: readonly Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
];

/**
 * The data a React example's parent passes it, by example: what its props name, as the page
 * around it would load. Functions an example calls back are the test's (see its behaviours).
 */
export const REACT_EXAMPLE_PROPS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  big: { points: spreadPoints(500) },
  markers: {
    locations: [
      {
        id: "rome",
        lat: 41.9028,
        lng: 12.4964,
        title: "Rome",
        data: { about: "Capital of Italy." },
      },
      { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", data: { starred: true } },
      { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
    ],
  },
  menu: { locations: CITIES },
  polygon: {
    locations: [
      {
        id: "park",
        type: "polygon",
        title: "Park",
        editable: true,
        path: [
          { lat: 41.91, lng: 12.48 },
          { lat: 41.92, lng: 12.5 },
          { lat: 41.9, lng: 12.5 },
        ],
      },
    ],
  },
  polyline: {
    trail: [
      {
        id: "trail",
        type: "polyline",
        title: "Trail",
        path: [
          { lat: 45.46, lng: 9.19 },
          { lat: 45.07, lng: 7.69 },
        ],
      },
    ],
  },
  route: { locations: CITIES },
  tabs: { locations: CITIES },
};
