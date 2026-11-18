// Routes on MapLibre from an OSRM server: createMapLibreAdapter({ computeRoute: osrmRoute() }).
// OSRM's public demo server is for trying it out, not for production: run your own, or use a
// hosted one, and pass its URL. The demo routes cars only, whatever profile is asked, and
// refuses `exclude`, so this leaves `avoid` out; a server built with those classes takes it.
import type {
  LatLng,
  RouteAnswer,
  RouteComputer,
  RouteRequest,
  RouteStep,
} from "@maplacejs/maplace";

/** The parts of OSRM's route answer read here (`steps=true`, `geometries=geojson`). */
export interface OsrmAnswer {
  readonly code: string;
  readonly message?: string;
  readonly routes?: readonly {
    readonly geometry: { readonly coordinates: readonly (readonly number[])[] };
    readonly legs: readonly {
      readonly distance: number;
      readonly duration: number;
      readonly steps: readonly OsrmStep[];
    }[];
  }[];
}

interface OsrmStep {
  readonly name: string;
  readonly distance: number;
  readonly duration: number;
  readonly maneuver: { readonly type: string; readonly modifier?: string };
}

/** OSRM's profile for each travel mode; it has no transit. */
const PROFILES = { driving: "driving", walking: "foot", bicycling: "bike" } as const;

/** A routing function asking the OSRM server at `server`. */
export function osrmRoute(server = "https://router.project-osrm.org"): RouteComputer {
  return async (request) => {
    const response = await fetch(routeUrl(server, request), { signal: request.signal });
    // OSRM answers its own refusals in JSON, with a code; anything else is the server's status.
    const answer: OsrmAnswer = await response.json().catch(() => {
      throw new Error(`OSRM: ${response.status} ${response.statusText}`);
    });
    if (answer.code !== "Ok") throw new Error(`OSRM: ${answer.message ?? answer.code}`);
    return answerOf(answer, request);
  };
}

/** The request's URL: every stop, the legs ending at those not passed through. */
function routeUrl(server: string, { stops, travelMode }: RouteRequest): string {
  if (travelMode === "transit") throw new Error("OSRM has no transit");
  const points = stops.map(({ lat, lng }) => `${lng},${lat}`).join(";");
  const ends = stops.flatMap(({ via }, index) => (via ? [] : [index])).join(";");
  const query = `waypoints=${ends}&overview=simplified&steps=true&geometries=geojson`;
  return `${server}/route/v1/${PROFILES[travelMode]}/${points}?${query}`;
}

/** OSRM's answer as maplace's: a leg between each two stops not passed through, in order. */
export function answerOf(answer: OsrmAnswer, { stops }: Pick<RouteRequest, "stops">): RouteAnswer {
  const route = answer.routes?.[0];
  if (route === undefined) throw new Error("OSRM found no route");
  const ends = stops.filter(({ via }) => !via).map(({ id }) => id);
  return {
    legs: route.legs.map((leg, index) => ({
      from: ends[index] ?? "",
      to: ends[index + 1] ?? "",
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
      steps: leg.steps.map(stepOf),
    })),
    // A point that isn't two numbers is passed on as it is, for maplace to refuse.
    path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }) as LatLng),
  };
}

function stepOf({ name, distance, duration, maneuver }: OsrmStep): RouteStep {
  return {
    instruction: instructionOf(maneuver, name),
    distanceMeters: distance,
    durationSeconds: duration,
  };
}

/** OSRM gives no words, only the manoeuvre and the road's name: a short English instruction. */
function instructionOf({ type, modifier = "" }: OsrmStep["maneuver"], name: string): string {
  const onto = name ? ` onto ${name}` : "";
  const side = modifier.replace("slight ", "").replace("sharp ", "");
  switch (type) {
    case "depart":
      return `Head out${onto}`;
    case "arrive":
      return "Arrive";
    case "fork":
      return `Keep ${side}${onto}`;
    case "merge":
      return `Merge ${side}${onto}`;
    case "on ramp":
      return `Take the ramp${onto}`;
    case "off ramp":
      return `Take the exit${onto}`;
    case "roundabout":
    case "rotary":
    case "roundabout turn":
      return `At the roundabout, continue${onto}`;
    case "exit roundabout":
    case "exit rotary":
      return `Leave the roundabout${onto}`;
    default:
      if (modifier === "uturn") return `Make a U-turn${onto}`;
      return modifier === "straight" || modifier === "" || type === "new name"
        ? `Continue${onto}`
        : `Turn ${modifier}${onto}`;
  }
}
