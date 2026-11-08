import { type Location, listedLocations } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { MapControl, MaplaceMap, MaplaceProvider, useMaplace } from "@maplacejs/maplace/react";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
  { id: "york", lat: 53.9591, lng: -1.0815, title: "York" },
  { id: "bath", lat: 51.3811, lng: -2.359, title: "Bath" },
  { id: "oxford", lat: 51.752, lng: -1.2577, title: "Oxford" },
  { id: "cambridge", lat: 52.2053, lng: 0.1218, title: "Cambridge", listed: false },
];

/**
 * A list of your own: a radio per location Maplace.js's lists would list, and one to fit them all;
 * the selection is checked.
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
      <MaplaceMap createAdapter={createGoogleAdapter} className="map">
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
