import { type Location, locationsFromGeoJSON } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function GeoJsonLayer() {
  const [features, setFeatures] = useState<readonly Location<{ about: string }>[]>([]);
  useEffect(() => {
    // Each feature a location: a Point a marker, a LineString a line, a Polygon an area.
    fetch("/examples/data/regents-park.json")
      .then((response) => response.json())
      .then((collection) => setFeatures(locationsFromGeoJSON<{ about: string }>(collection)));
  }, []);
  return (
    <MaplaceProvider locations={features}>
      <div className="map-and-list">
        <MaplaceMap
          createAdapter={createGoogleAdapter}
          className="map"
          // Each feature's about property, in the popup a click opens.
          popupContent={({ data }: Location<{ about: string }>) => data?.about}
        />
        <LocationList />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("geojson-react-root") as HTMLElement).render(
  <StrictMode>
    <GeoJsonLayer />
  </StrictMode>,
);
