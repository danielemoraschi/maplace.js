import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
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
      <MaplaceMap createAdapter={createGoogleAdapter} className="map">
        {/* A list of what is in view, with "This area only" after a move, then "Show all". */}
        <LocationList scope="viewport" position="top-right" />
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("big-react-root") as HTMLElement).render(
  <StrictMode>
    <Big />
  </StrictMode>,
);
