import { createGoogleMap } from "maplace/google";

const center = { lat: 41.9028, lng: 12.4964 };
const selectedStyle = { stroke: "#c2410c", fill: "#f97316" };
const maplace = createGoogleMap("#circles-vanilla-map", {
  mapId: "DEMO_MAP_ID",
  selectedId: "center",
  locations: [
    {
      id: "center",
      type: "circle",
      center,
      radius: 5_000,
      title: "Within 5 km",
      style: { stroke: "#1d4ed8", fill: "#3b82f6" },
      selectedStyle,
      content: () => popupOf("Within 5 km", "The historic centre, on foot."),
    },
    {
      id: "ring",
      type: "circle",
      center,
      radius: 15_000,
      title: "Within 15 km",
      style: { stroke: "#15803d", fill: "#22c55e" },
      selectedStyle,
      content: () => popupOf("Within 15 km", "Inside the ring road, by bike."),
    },
    {
      id: "resizable",
      type: "circle",
      center: { lat: 41.8, lng: 12.75 },
      radius: 8_000,
      title: "Change my size",
      editable: true,
      style: { stroke: "#7c3aed", fill: "#a78bfa" },
    },
  ],
  list: { container: "#circles-vanilla-list" },
});

maplace.on("locationEdit", ({ location, geometry }) => {
  if (geometry.type === "circle") showRadius(location.id, geometry.radius);
});
maplace.on("locationChange", ({ location }) => {
  if (location.type === "circle") showRadius(location.id, location.radius);
});

const readout = document.querySelector<HTMLOutputElement>("#circles-vanilla-radius");
/** The editable circle's radius, while it is resized and once it is. */
function showRadius(id: string, radius: number): void {
  if (readout && id === "resizable")
    readout.textContent = `Radius: ${(radius / 1000).toFixed(1)} km`;
}

/** A popup's content: the title in bold, then a line about the area. */
function popupOf(title: string, about: string): DocumentFragment {
  const heading = document.createElement("strong");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = about;
  const content = document.createDocumentFragment();
  content.append(heading, text);
  return content;
}
