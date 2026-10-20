import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
];
const notes: Readonly<Record<string, string>> = {
  rome: "Capital since 1871.",
  milan: "Finance and fashion.",
};

const noteOf = (id: string | undefined) => (id === undefined ? "" : (notes[id] ?? ""));

/** The chosen place's note, read from the store: the selection it starts on, and every one after. */
function TabDetails() {
  const maplace = useMaplace();
  const selectedId = useSyncExternalStore(
    maplace.subscribe,
    () => maplace.getSnapshot().selectedId,
  );
  return <aside>{noteOf(selectedId)}</aside>;
}

function Tabs() {
  return (
    <MaplaceProvider locations={cities} defaultSelectedId="rome">
      <div className="panel">
        <LocationList />
        <TabDetails />
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("tabs-react-root") as HTMLElement).render(
  <StrictMode>
    <Tabs />
  </StrictMode>,
);
