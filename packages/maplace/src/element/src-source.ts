import type { Location } from "../index";
import { dispatchElementEvent } from "./event-forwarding";
import { LocationFile } from "./location-file";
import { srcOf } from "./location-sources";
import type { StandingMisuse } from "./standing-misuse";

/**
 * A map's `src` as the source of its locations: checked, and its file loaded once the map
 * opened past `hold`. A load that fails is the element's `maplace-error`.
 */
export class SrcSource {
  readonly #host: HTMLElement;
  readonly #misuse: StandingMisuse;
  readonly #file: LocationFile;
  /** The `src` last read that passed its check, while it stands. */
  #wanted: string | undefined;
  #allowed = false;

  /**
   * `onRead` applies the file's locations, given as a `read` that throws what they misuse, and
   * returns whether they were taken.
   */
  constructor(
    host: HTMLElement,
    misuse: StandingMisuse,
    onRead: (read: () => readonly Location[]) => boolean,
  ) {
    this.#host = host;
    this.#misuse = misuse;
    this.#file = new LocationFile(onRead, (error) =>
      dispatchElementEvent(host, "error", { error }),
    );
  }

  /** Whether a file is wanted whose locations aren't in: a route waits for them. */
  get awaiting(): boolean {
    return this.#wanted !== undefined && this.#wanted !== this.#file.loadedUrl;
  }

  /** The map opened past `hold`: the file wanted loads, and any later one. */
  allowLoads(): void {
    // Opened again without closing (a move, a second `release()`): a file that failed waits for `src`.
    if (this.#allowed) return;
    this.#allowed = true;
    this.#loadIfAllowed();
  }

  /** The map stopped: a load in flight is dropped, and none starts until it opens again. */
  holdLoads(): void {
    this.#allowed = false;
    this.#file.dropLoadInFlight();
  }

  /** `src` set again, or the element's source changed: a file refused is fetched on the next read. */
  forgetRefused(): void {
    this.#file.forgetRefused();
  }

  /** Checks `src`, then loads its file if the map may. */
  read(): void {
    this.check();
    this.#loadIfAllowed();
  }

  /** Checks `src` as it stands, loading nothing: a misuse stops the load. */
  check(): void {
    this.#wanted = this.#misuse.retry("src", () => srcOf(this.#host));
    if (this.#wanted === undefined) this.#file.stop();
  }

  /** No `src` from now on, its misuse with it: removed, or the locations given. */
  stop(): void {
    this.#wanted = undefined;
    this.#file.stop();
    this.#misuse.clear("src");
  }

  #loadIfAllowed(): void {
    if (this.#allowed && this.#wanted !== undefined) this.#file.load(this.#wanted);
  }
}
