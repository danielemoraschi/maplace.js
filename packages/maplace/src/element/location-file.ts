import {
  type GeoJSONFeatureCollection,
  type Location,
  locationsFromGeoJSON,
  type MaplaceError,
} from "../index";
import { jsonIn } from "./attribute-values";
import { elementError, elementMisuse } from "./element-error";

/**
 * The file a map's `src` names: fetched, the latest URL winning, and handed on as a `read` that
 * gives its locations, so whoever applies them reports what they hold. The URL in hand is not
 * fetched twice, one whose locations were refused included, until `forgetRefused` or `stop`; a load
 * that fails is reported and forgotten, so the next load of its URL fetches again.
 */
export class LocationFile {
  readonly #onRead: (read: () => readonly Location[]) => boolean;
  readonly #onFailure: (error: MaplaceError) => void;
  #url: string | undefined;
  /** The load in flight, if any: an answer to any other is dropped. */
  #loading: AbortController | undefined;
  /** Whether the URL in hand gave locations that were refused. */
  #refused = false;

  /** `onRead` applies the locations and returns whether they were taken. */
  constructor(
    onRead: (read: () => readonly Location[]) => boolean,
    onFailure: (error: MaplaceError) => void,
  ) {
    this.#onRead = onRead;
    this.#onFailure = onFailure;
  }

  /** The URL whose locations were taken, until `stop`. */
  get loadedUrl(): string | undefined {
    return this.#loading === undefined && !this.#refused ? this.#url : undefined;
  }

  load(url: string): void {
    if (url === this.#url) return;
    this.stop();
    this.#url = url;
    this.#loading = new AbortController();
    void this.#fetch(url, this.#loading);
  }

  /** Drops the load in flight, if any, and forgets the URL. */
  stop(): void {
    this.#loading?.abort();
    this.#loading = undefined;
    this.#url = undefined;
    this.#refused = false;
  }

  /** A file whose locations were refused is fetched again on the next load. */
  forgetRefused(): void {
    if (this.#refused) this.stop();
  }

  /** Drops the load in flight, if any, so the next load fetches it again; a file in hand stays. */
  dropLoadInFlight(): void {
    if (this.#loading !== undefined) this.stop();
  }

  async #fetch(url: string, loading: AbortController): Promise<void> {
    let text: string;
    try {
      const response = await fetch(url, { signal: loading.signal });
      if (!response.ok) throw new Error(`the server answered ${response.status}`);
      text = await response.text();
    } catch (cause) {
      if (loading !== this.#loading) return;
      this.stop();
      const problem = cause instanceof Error ? cause.message : String(cause);
      this.#onFailure(
        elementError("locations-load-failed", `src "${url}" didn't load: ${problem}`, {
          field: "src",
          cause,
        }),
      );
      return;
    }
    // A page's own fetch may ignore the abort: only the load still in flight counts.
    if (loading !== this.#loading) return;
    this.#loading = undefined;
    const taken = this.#onRead(() => locationsInFile(text, url));
    this.#refused = !taken;
  }
}

/**
 * The locations in a file's `text`: a list of locations, or a GeoJSON FeatureCollection read as
 * `locationsFromGeoJSON` reads it. Anything else is misuse.
 */
export function locationsInFile(text: string, url: string): readonly Location[] {
  const json = jsonIn(text, `src "${url}"`, { field: "src" });
  if (Array.isArray(json)) return json;
  if (isFeatureCollection(json)) return locationsFromGeoJSON(json);
  throw elementMisuse(`src "${url}" must hold a list of locations or a GeoJSON FeatureCollection`, {
    field: "src",
  });
}

function isFeatureCollection(json: unknown): json is GeoJSONFeatureCollection {
  return (json as GeoJSONFeatureCollection | null)?.type === "FeatureCollection";
}
