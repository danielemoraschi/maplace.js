import { type Location, listedLocations } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MapControl, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin" },
  { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", listed: false },
];

/**
 * A list of your own, as 0.2's "checks" menu: a radio per location maplace's lists would list,
 * and one to fit them all; the selection is checked.
 */
function ChecksMenu({ heading }: { readonly heading: string }) {
  const maplace = useMaplace();
  const snapshot = useSyncExternalStore(maplace.subscribe, maplace.getSnapshot);
  const choose = (id: string) => {
    maplace.select(id || undefined);
    if (!id) maplace.fitAll();
  };
  const choices = [{ id: "", title: "Fit all" }, ...listedLocations(snapshot)];
  return (
    <fieldset>
      <legend>{heading}</legend>
      <div>
        {choices.map(({ id, title }) => (
          <label key={id}>
            <input
              type="radio"
              name="custom-list-react-choice"
              value={id}
              checked={(snapshot.selectedId ?? "") === id}
              onChange={() => choose(id)}
            />{" "}
            {title ?? id}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CustomList() {
  return (
    <MaplaceProvider locations={cities}>
      <MaplaceMap createAdapter={createAdapter} className="map">
        <MapControl position="top-right">
          <ChecksMenu heading="Choose a location:" />
        </MapControl>
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("custom-list-react-root") as HTMLElement).render(
  <StrictMode>
    <CustomList />
  </StrictMode>,
);
