import type { Location, Route as MaplaceRoute, RouteLeg, RouteResult, RouteStep } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "zurich", lat: 47.3769, lng: 8.5417, title: "Zurich" },
  { id: "paris", lat: 48.8566, lng: 2.3522, title: "Paris" },
  { id: "munich", lat: 48.1351, lng: 11.582, title: "Munich" },
];
const ROUTE: MaplaceRoute = {
  stops: ["milan", "zurich", "paris", "munich"],
  via: ["zurich"],
  travelMode: "driving",
};

const km = (meters: number) => `${Math.round(meters / 1000)} km`;
const titleOf = (id: string) => cities.find((city) => city.id === id)?.title ?? id;
const keyOf = (step: RouteStep) =>
  `${step.distanceMeters}:${step.durationSeconds}:${step.instruction ?? ""}`;

/** A leg's steps, headed by where it runs and how far; a step without words shows its distance. */
function LegDirections({ leg }: { readonly leg: RouteLeg }) {
  return (
    <>
      <h3>
        {titleOf(leg.from)} → {titleOf(leg.to)}, {km(leg.distanceMeters)}
      </h3>
      <ol>
        {leg.steps.map((step) => (
          <li key={keyOf(step)}>
            {step.instruction ?? `${(step.distanceMeters / 1000).toFixed(1)} km`}
          </li>
        ))}
      </ol>
    </>
  );
}

function Route() {
  const [result, setResult] = useState<RouteResult>();
  return (
    <MaplaceProvider
      locations={cities}
      route={ROUTE}
      onRouteChange={({ result }) => setResult(result)}
    >
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        <LocationList />
      </div>
      <div className="directions">
        {result?.legs.map((leg) => (
          <LegDirections key={`${leg.from}-${leg.to}`} leg={leg} />
        ))}
      </div>
      <p>
        Total: <output>{result ? km(result.distanceMeters) : ""}</output>
      </p>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("route-react-root") as HTMLElement).render(
  <StrictMode>
    <Route />
  </StrictMode>,
);
