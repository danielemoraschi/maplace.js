// Draft: becomes `maplace/react` in 1.x.
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const center = { lat: 41.9028, lng: 12.4964 };

export function Circles() {
  return (
    <MaplaceProvider
      locations={[
        { id: "near", type: "circle", center, radius: 5_000, title: "Within 5 km" },
        { id: "far", type: "circle", center, radius: 15_000, title: "Within 15 km" },
      ]}
    >
      <MaplaceMap adapter={adapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
