import type { Location } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

function LoadOnDemand() {
  const [loaded, setLoaded] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const load = () => {
    // The panel goes as it's pressed: focus stays here, not at the top of the page.
    box.current?.focus({ preventScroll: true });
    setLoaded(true);
  };
  return (
    <div className="box" ref={box} tabIndex={-1}>
      {loaded ? (
        <MaplaceProvider locations={cities}>
          <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        </MaplaceProvider>
      ) : (
        <div className="load-panel">
          <span>Loads from Google</span>
          <button type="button" onClick={load}>
            Load map
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("load-on-demand-react-root") as HTMLElement).render(
  <StrictMode>
    <LoadOnDemand />
  </StrictMode>,
);
