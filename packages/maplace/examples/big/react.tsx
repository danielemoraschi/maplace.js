import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

function Big() {
  const [points, setPoints] = useState<readonly Location[]>([]);
  useEffect(() => {
    fetch("/points-4k.json")
      .then((response) => response.json())
      .then(setPoints);
  }, []);
  return (
    <MaplaceProvider locations={points} cluster>
      <MaplaceMap createAdapter={createAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("big-react-root") as HTMLElement).render(
  <StrictMode>
    <Big />
  </StrictMode>,
);
