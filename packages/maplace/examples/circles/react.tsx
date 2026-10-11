import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const center = { lat: 41.9028, lng: 12.4964 };
const circles: Location[] = [
  { id: "near", type: "circle", center, radius: 5_000, title: "Within 5 km" },
  { id: "far", type: "circle", center, radius: 15_000, title: "Within 15 km" },
];

export function Circles() {
  return (
    <MaplaceProvider locations={circles}>
      <MaplaceMap createAdapter={createAdapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
