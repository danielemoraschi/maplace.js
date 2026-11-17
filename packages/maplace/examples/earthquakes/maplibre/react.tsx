import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** The quakes' group is drawn as heat, each quake weighing its magnitude; the volcanoes, pins. */
const HEATMAP = { groups: ["Quakes"] };
const FIRST_VIEW = { kind: "center", center: { lat: 20, lng: 160 }, zoom: 2 } as const;

async function fetched(url: string): Promise<Location[]> {
  return (await fetch(url)).json();
}

function Earthquakes() {
  const [locations, setLocations] = useState<readonly Location[]>([]);
  useEffect(() => {
    Promise.all([
      fetched("/examples/data/earthquakes.json"),
      fetched("/examples/data/volcanoes.json"),
    ]).then(([quakes, volcanoes]) => setLocations([...quakes, ...volcanoes]));
  }, []);
  return (
    <MaplaceProvider locations={locations} heatmap={HEATMAP} view={FIRST_VIEW}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList search searchLabel="Find a quake or a volcano" groupFilter />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("earthquakes-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Earthquakes />
  </StrictMode>,
);
