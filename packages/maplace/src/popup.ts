/** How popups open and where they sit. */
export interface PopupOptions {
  readonly maxWidth?: number | undefined;
  /** Pixel offset from the anchor, `[x, y]`. Default `[0, 0]`. */
  readonly offset?: readonly [number, number] | undefined;
  /** Default `click`. */
  readonly openOn?: "click" | "hover" | undefined;
  /**
   * Adds a link at the end of a popup, to the location on the provider's maps site. A location with
   * no content has no popup, so no link; `invalid-input` with `openOn: "hover"`.
   */
  readonly openInMapsLink?: boolean | undefined;
  /** The words of the link `openInMapsLink` adds. Default "Open in Maps"; nothing without it. */
  readonly openInMapsLabel?: string | undefined;
  /**
   * Adds a link at the end of a popup, to directions to the location. A location with no content
   * has no popup, so no link; `invalid-input` with `openOn: "hover"`.
   */
  readonly directionsLink?: boolean | undefined;
  /** The words of the link `directionsLink` adds. Default "Directions"; does nothing without it. */
  readonly directionsLabel?: string | undefined;
}

/** Popup options after the store applied defaults; what adapters receive. */
export interface ResolvedPopupOptions {
  readonly maxWidth: number | undefined;
  readonly offset: readonly [number, number];
  readonly openOn: "click" | "hover";
  /** The words of the link to the provider's maps site; `undefined` draws no link. */
  readonly openInMapsLabel: string | undefined;
  /** The words of the link to directions; `undefined` draws no link. */
  readonly directionsLabel: string | undefined;
}
