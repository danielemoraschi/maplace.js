import { createGoogleMap } from "maplace/google";

createGoogleMap("#popups-vanilla-map", {
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
    { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
  ],
  popup: { openInMapsLink: true, directionsLink: true },
});

/** A popup's content: a line about the place, under its title (the popup's heading). */
function popupOf(about: string): HTMLParagraphElement {
  const text = document.createElement("p");
  text.textContent = about;
  return text;
}
