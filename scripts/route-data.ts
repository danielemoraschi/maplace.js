// Writes the route example's stored route on MapLibre, Milan to Munich through Zurich and Paris by
// car, from OSRM's answer kept in scripts/route-data/ with the fields the recipe reads: run once by
// hand, `node scripts/route-data.ts`, then `npm run fix`. The answer came from OSRM's demo server
// (router.project-osrm.org) on 2026-11-18; its roads are OpenStreetMap's, under the ODbL.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./build/package.ts";
import { answerOf } from "./recipes/osrm-route.ts";
import { STORED_ROUTE_STOPS } from "./route-data/stops.ts";

const osrm = JSON.parse(
  readFileSync(join(ROOT, "scripts/route-data/osrm-milan-munich.json"), "utf8"),
);
const route = {
  attribution: "Route by OSRM, roads © OpenStreetMap contributors (ODbL)",
  stops: STORED_ROUTE_STOPS.map(({ id }) => id),
  ...answerOf(osrm, { stops: STORED_ROUTE_STOPS }),
};
writeFileSync(
  join(ROOT, "packages/maplace/examples/data/route-milan-munich.json"),
  JSON.stringify(route),
);
