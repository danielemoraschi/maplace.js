/** How popups open and where they sit. */
export interface PopupOptions {
  readonly maxWidth?: number;
  /** Pixel offset from the anchor, `[x, y]`. */
  readonly offset?: readonly [number, number];
  /** Default `click`. */
  readonly openOn?: "click" | "hover";
}
