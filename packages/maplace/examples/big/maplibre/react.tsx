import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function Big() {
  const [points, setPoints] = useState<readonly Location[]>([]);
  useEffect(() => {
    fetch("/points-4k.json")
      .then((response) => response.json())
      .then(setPoints);
  }, []);
  return (
    <MaplaceProvider locations={points} cluster>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("big-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Big />
  </StrictMode>,
);
