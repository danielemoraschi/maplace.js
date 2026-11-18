import "maplibre-gl/dist/maplibre-gl.css";
import type { Location, RouteAnswer, RouteComputer, RouteLeg } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

const locations: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "zurich", lat: 47.3769, lng: 8.5417, title: "Zurich" },
  { id: "paris", lat: 48.8566, lng: 2.3522, title: "Paris" },
  { id: "munich", lat: 48.1351, lng: 11.582, title: "Munich" },
];

/**
 * Answers as a routing service would, from the route stored beside the example (its stops' ids,
 * legs and path); any other journey is refused.
 */
const storedRoute: RouteComputer = async ({ stops, signal }) => {
  const response = await fetch("/examples/data/route-milan-munich.json", { signal });
  if (!response.ok) throw new Error(`The stored route: ${response.status}`);
  const route: RouteAnswer & { stops: string[] } = await response.json();
  if (stops.map(({ id }) => id).join() !== route.stops.join()) {
    throw new Error("This example has one stored route: Milan to Munich");
  }
  return route;
};

// MapLibre has no routing of its own: the page's computeRoute answers (a live service, such as
// OSRM, in your page).
const maplace = createMapLibreMap("#route-maplibre-vanilla-map", {
  locations,
  computeRoute: storedRoute,
  list: { container: "#route-maplibre-vanilla-list" },
});
maplace.setRoute({
  stops: ["milan", "zurich", "paris", "munich"],
  via: ["zurich"],
  travelMode: "driving",
});

const km = (meters: number) => `${Math.round(meters / 1000)} km`;
const titleOf = (id: string) => locations.find((location) => location.id === id)?.title ?? id;
const directions = document.querySelector("#route-maplibre-vanilla-directions");
const distance = document.querySelector("#route-maplibre-vanilla-distance");
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
