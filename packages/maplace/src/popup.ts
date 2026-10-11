/** How popups open and where they sit. */
export interface PopupOptions {
  readonly maxWidth?: number | undefined;
  /** Pixel offset from the anchor, `[x, y]`. Default `[0, 0]`. */
  readonly offset?: readonly [number, number] | undefined;
  /** Default `click`. */
  readonly openOn?: "click" | "hover" | undefined;
}

/** Popup options after the store applied defaults; what adapters receive. */
export interface ResolvedPopupOptions {
  readonly maxWidth: number | undefined;
  readonly offset: readonly [number, number];
  readonly openOn: "click" | "hover";
}
