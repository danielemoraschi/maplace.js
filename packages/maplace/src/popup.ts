/** How popups open and where they sit. */
export interface PopupOptions {
  readonly maxWidth?: number | undefined;
  /** Pixel offset from the anchor, `[x, y]`. Default `[0, 0]`. */
  readonly offset?: readonly [number, number] | undefined;
  /** Default `click`. */
  readonly openOn?: "click" | "hover" | undefined;
  /**
   * Adds a link with these words at the end of a popup, to the location on the provider's maps site.
   * A location with no content has no popup, so no link; `invalid-input` with `openOn: "hover"`.
   */
  readonly openInMapsLabel?: string | undefined;
  /** Adds a link with these words at the end of a popup, to directions there; as `openInMapsLabel`. */
  readonly directionsLabel?: string | undefined;
}

/** Popup options after the store applied defaults; what adapters receive. */
export interface ResolvedPopupOptions {
  readonly maxWidth: number | undefined;
  readonly offset: readonly [number, number];
  readonly openOn: "click" | "hover";
  readonly openInMapsLabel: string | undefined;
  readonly directionsLabel: string | undefined;
}
