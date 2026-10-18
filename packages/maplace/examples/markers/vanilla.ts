import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

/** A popup's content: the title in bold, then a line about the place. */
function popupOf(title: string, about: string): DocumentFragment {
  const heading = document.createElement("strong");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = about;
  const content = document.createDocumentFragment();
  content.append(heading, text);
  return content;
}

const star = document.createElement("span");
star.textContent = "★";

const locations: Location[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    content: () => popupOf("Rome", "Capital of Italy."),
  },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", icon: star },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

const maplace = createMaplace({ locations });
const container = document.getElementById("markers-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("markers-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);
