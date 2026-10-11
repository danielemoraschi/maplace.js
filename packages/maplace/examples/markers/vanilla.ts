import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const star = document.createElement("span");
star.textContent = "★";

const locations: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", content: "Capital of Italy." },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", icon: star },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

const maplace = createMaplace({ locations });
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);
