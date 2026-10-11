import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

export function Simple() {
  return (
    <MaplaceProvider locations={rome}>
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
