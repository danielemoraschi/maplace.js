import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "@maplacejs/maplace/react";
import { Fragment, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** The quakes' group is drawn as heat, each quake weighing its magnitude; the volcanoes, pins. */
const HEATMAP = { groups: ["quakes"] };
const FIRST_VIEW = { kind: "center", center: { lat: 20, lng: 160 }, zoom: 2 } as const;

const GROUPS = [
  { group: "quakes", label: "Quakes" },
  { group: "volcanoes", label: "Volcanoes" },
];

async function fetched(url: string): Promise<Location[]> {
  return (await fetch(url)).json();
}

/** The checkboxes show the groups ticked, keeping what the search box found. */
function GroupFilter() {
  const maplace = useMaplace();
  const [groups, setGroups] = useState<readonly string[]>(() => GROUPS.map(({ group }) => group));
  const show = (shown: readonly string[]) => {
    setGroups(shown);
    maplace.setFilter({ ...maplace.getSnapshot().filter, groups: shown });
  };
  return (
    <p>
      {GROUPS.map(({ group, label }) => (
        <Fragment key={group}>
          <label>
            <input
              type="checkbox"
              checked={groups.includes(group)}
              onChange={(event) =>
                show(
                  event.target.checked
                    ? [...groups, group]
                    : groups.filter((other) => other !== group),
                )
              }
            />{" "}
            {label}
          </label>{" "}
        </Fragment>
      ))}
    </p>
  );
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
      <GroupFilter />
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList search searchLabel="Find a quake or a volcano" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("earthquakes-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Earthquakes />
  </StrictMode>,
);
