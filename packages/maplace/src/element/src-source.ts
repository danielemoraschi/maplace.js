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

  /** `onRead` applies the file's locations, given as a `read` that throws what they misuse. */
  constructor(
    host: HTMLElement,
    misuse: StandingMisuse,
    onRead: (read: () => readonly Location[]) => void,
  ) {
    this.#host = host;
    this.#misuse = misuse;
    this.#file = new LocationFile(onRead, (error) =>
      dispatchElementEvent(host, "error", { error }),
    );
  }

  /** Whether a file is wanted and not in yet: a route waits for its locations. */
  get awaiting(): boolean {
    return this.#wanted !== undefined && this.#wanted !== this.#file.loadedUrl;
  }

  /** The map opened past `hold`: the file wanted loads, and any later one. */
  allowLoads(): void {
    this.#allowed = true;
    this.#loadIfAllowed();
  }

  /** The map stopped: no file loads until it opens again. */
  holdLoads(): void {
    this.#allowed = false;
  }

  /** Checks `src`, then loads its file if the map may; a misuse stops the load. */
  read(): void {
    this.#wanted = this.#misuse.retry("src", () => srcOf(this.#host));
    if (this.#wanted === undefined) this.#file.stop();
    else this.#loadIfAllowed();
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
