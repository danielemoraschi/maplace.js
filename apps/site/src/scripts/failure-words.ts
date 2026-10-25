import type { MaplaceError } from "maplace";
import type { Provider } from "../examples/example-providers.ts";
import {
  type CodeFailure,
  isCodeFailure,
  type MapFailure,
  type VersionFailure,
} from "./version-failures.ts";

const NOTE = "The map couldn't load";

/** Why a map didn't load, by its error's code, on each provider: the visitor's words. */
const REASONS: Readonly<Record<Provider, Partial<Record<MaplaceError["code"], string>>>> = {
  google: {
    "provider-auth-failed": "Google refused this site's key.",
    "provider-load-failed": "Google Maps didn't load. A blocker, or the network?",
  },
  maplibre: {
    "provider-auth-failed": "OpenFreeMap refused the map's style.",
    "provider-load-failed": "OpenFreeMap's map didn't load. A blocker, or the network?",
  },
};

/** Why a map on `provider` didn't load, for the visitor; the element's message is the developer's. */
function reasonFor({ code, field }: MapFailure, provider: Provider): string | undefined {
  if (field === "api-key" && provider === "google") return "this site has no Google Maps key.";
  return REASONS[provider][code];
}

/** The note a frame shows for a map on `provider` that failed. */
function failureNote(failure: MapFailure, provider: Provider): string {
  const reason = reasonFor(failure, provider);
  return reason === undefined ? `${NOTE}.` : `${NOTE}: ${reason}`;
}

/** The note for each reason a version's own code didn't run (`CodeFailure`). */
const CODE_FAILURES: Readonly<Record<CodeFailure, string>> = {
  script: `${NOTE}: its script didn't load. The network?`,
  module: `${NOTE}: its code didn't load or run.`,
  program: `${NOTE}: its program threw an error as it ran.`,
};

/** The note for a version on `provider` that didn't start: its readying's, or its code's. */
export function versionFailureNote(failure: VersionFailure, provider: Provider): string {
  return isCodeFailure(failure) ? CODE_FAILURES[failure] : failureNote(failure, provider);
}
