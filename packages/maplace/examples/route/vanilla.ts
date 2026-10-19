import type { Location, RouteLeg } from "maplace";
import { createGoogleMap } from "maplace/google";

const locations: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "zurich", lat: 47.3769, lng: 8.5417, title: "Zurich" },
  { id: "paris", lat: 48.8566, lng: 2.3522, title: "Paris" },
  { id: "munich", lat: 48.1351, lng: 11.582, title: "Munich" },
];
const maplace = createGoogleMap("#route-vanilla-map", {
  mapId: "DEMO_MAP_ID",
  locations,
  list: { container: "#route-vanilla-list" },
});
maplace.setRoute({
  stops: ["milan", "zurich", "paris", "munich"],
  via: ["zurich"],
  travelMode: "driving",
});

const km = (meters: number) => `${Math.round(meters / 1000)} km`;
const titleOf = (id: string) => locations.find((location) => location.id === id)?.title ?? id;
const directions = document.querySelector("#route-vanilla-directions");
const distance = document.querySelector("#route-vanilla-distance");
maplace.on("routeChange", ({ result }) => {
  directions?.replaceChildren(...(result?.legs.flatMap(legDirections) ?? []));
  if (distance) distance.textContent = result ? km(result.distanceMeters) : "";
});

/** A leg's steps, headed by where it runs and how far; a step without words shows its distance. */
function legDirections(leg: RouteLeg): HTMLElement[] {
  const heading = document.createElement("h3");
  heading.textContent = `${titleOf(leg.from)} → ${titleOf(leg.to)}, ${km(leg.distanceMeters)}`;
  const steps = document.createElement("ol");
  for (const step of leg.steps) {
    const item = document.createElement("li");
    item.textContent = step.instruction ?? `${(step.distanceMeters / 1000).toFixed(1)} km`;
    steps.append(item);
  }
  return [heading, steps];
}
