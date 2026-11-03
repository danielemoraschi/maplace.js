import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

createMapLibreMap("#popups-maplibre-vanilla-map", {
  locations: [
    {
      id: "rome",
      lat: 41.9028,
      lng: 12.4964,
      title: "Rome",
      content: () => popupOf("Capital of Italy."),
    },
    {
      id: "milan",
      lat: 45.4642,
      lng: 9.19,
      title: "Milan",
      content: () => popupOf("Finance and fashion."),
    },
    {
      id: "venice",
      lat: 45.4408,
      lng: 12.3155,
      title: "Venice",
      content: () =>
        popupWithList("A city on 118 islands.", ["Over 400 bridges", "No cars, only boats"]),
    },
  ],
  view: { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 },
  popup: { openInMapsLink: true, directionsLink: true },
});

/** A popup's content: a line about the place, under its title (the popup's heading). */
function popupOf(about: string): HTMLParagraphElement {
  const text = document.createElement("p");
  text.textContent = about;
  return text;
}

/** A popup's line, then a list under it: any markup a node can hold. */
function popupWithList(about: string, facts: readonly string[]): HTMLDivElement {
  const list = document.createElement("ul");
  list.append(...facts.map(listItemOf));
  const popup = document.createElement("div");
  popup.append(popupOf(about), list);
  return popup;
}

function listItemOf(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}
