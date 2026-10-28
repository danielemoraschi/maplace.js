import type { Location, Route } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { Fragment, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** Each data set's button, by its file's letter: `/mixed-a.json` is the markers. */
const GROUPS = { a: "Markers", b: "More markers", c: "Route", d: "Area", e: "Circle" };

/** A data set shown, the route's (c) with a route through it. */
interface Shown {
  readonly locations: readonly Location[];
  readonly route: Route | undefined;
}

const NOTHING: Shown = { locations: [], route: undefined };

async function fetchGroup(letter: string): Promise<Shown> {
  const response = await fetch(`/mixed-${letter}.json`);
  const locations: Location[] = await response.json();
  const stops = locations.map(({ id }) => id);
  return { locations, route: letter === "c" ? { stops, travelMode: "driving" } : undefined };
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
  const [shown, setShown] = useState(NOTHING);
  // Only the group last asked for: a slower answer to an earlier click is dropped.
  useEffect(() => {
    let latest = true;
    fetchGroup(group).then((fetched) => latest && setShown(fetched));
    return () => {
      latest = false;
    };
  }, [group]);
  return (
    <MaplaceProvider locations={shown.locations} route={shown.route}>
      <p>
        {/* A space after each button, as between buttons written in HTML. */}
        {Object.entries(GROUPS).map(([letter, label]) => (
          <Fragment key={letter}>
            <button type="button" aria-pressed={letter === group} onClick={() => setGroup(letter)}>
              {label}
            </button>{" "}
          </Fragment>
        ))}
      </p>
      <FitAllOnSwap locations={shown.locations} />
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        <LocationList />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("mixed-react-root") as HTMLElement).render(
  <StrictMode>
    <Mixed />
  </StrictMode>,
);
