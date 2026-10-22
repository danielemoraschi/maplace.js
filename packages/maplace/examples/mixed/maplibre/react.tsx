import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { Fragment, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const GROUPS = ["a", "b", "c", "d", "e"];

const NO_LOCATIONS: readonly Location[] = [];

/** A data set: on MapLibre, which has no routing, group C is its markers alone. */
async function fetchGroup(letter: string): Promise<Location[]> {
  const response = await fetch(`/mixed-${letter}.json`);
  return response.json();
}

/** Fits the map to every location each time a data set is swapped in. */
function FitAllOnSwap({ locations }: { readonly locations: readonly Location[] }) {
  const maplace = useMaplace();
  useEffect(() => {
    if (locations.length > 0) maplace.fitAll();
  }, [maplace, locations]);
  return null;
}

function Mixed() {
  const [group, setGroup] = useState("a");
  const [locations, setLocations] = useState(NO_LOCATIONS);
  // Only the group last asked for: a slower answer to an earlier click is dropped.
  useEffect(() => {
    let latest = true;
    fetchGroup(group).then((fetched) => latest && setLocations(fetched));
    return () => {
      latest = false;
    };
  }, [group]);
  return (
    <MaplaceProvider locations={locations}>
      <p>
        {/* A space after each button, as between buttons written in HTML. */}
        {GROUPS.map((letter) => (
          <Fragment key={letter}>
            <button type="button" aria-pressed={letter === group} onClick={() => setGroup(letter)}>
              Group {letter.toUpperCase()}
            </button>{" "}
          </Fragment>
        ))}
      </p>
      <FitAllOnSwap locations={locations} />
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("mixed-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Mixed />
  </StrictMode>,
);
