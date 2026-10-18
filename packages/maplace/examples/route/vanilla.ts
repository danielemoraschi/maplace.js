import { createListView, createMaplace, type Location, type RouteLeg } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const locations: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "zurich", lat: 47.3769, lng: 8.5417, title: "Zurich" },
  { id: "paris", lat: 48.8566, lng: 2.3522, title: "Paris" },
  { id: "munich", lat: 48.1351, lng: 11.582, title: "Munich" },
];
const maplace = createMaplace({ locations });
const container = document.getElementById("route-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("route-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);
maplace.setRoute({
  stops: ["milan", "zurich", "paris", "munich"],
  via: ["zurich"],
  travelMode: "driving",
});

const km = (meters: number) => `${Math.round(meters / 1000)} km`;
const titleOf = (id: string) => locations.find((location) => location.id === id)?.title ?? id;

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

const directions = document.getElementById("route-vanilla-directions") as HTMLElement;
const distance = document.getElementById("route-vanilla-distance") as HTMLOutputElement;
maplace.on("routeChange", ({ result }) => {
  directions.replaceChildren(...(result?.legs.flatMap(legDirections) ?? []));
  distance.textContent = result ? km(result.distanceMeters) : "";
});
