import type { ConformanceSubject } from "../../testing/conformance/subject";
import { assembleGoogleAdapter } from "../assemble";
import { createMapState } from "../map-state";
import type { GoogleAdapterOptions } from "../options";
import { createGoogleProbe } from "./probe";

/** The tests' Google adapter: on Google's public demo map ID. */
export const TEST_OPTIONS: GoogleAdapterOptions = { mapId: "DEMO_MAP_ID" };

/** A new Google adapter, its probe, and the map state the adapter draws into. */
export function googleParts(options = TEST_OPTIONS) {
  const state = createMapState();
  return { state, adapter: assembleGoogleAdapter(options, state), probe: createGoogleProbe() };
}

/** Google for the conformance suite: a new adapter and probe for every check. */
export const GOOGLE_SUBJECT: ConformanceSubject = { name: "google", create: () => googleParts() };
