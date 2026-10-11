// Draft: becomes `maplace/react` in 1.x.
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Simple() {
  return (
    <MaplaceProvider locations={[{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }]}>
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
