import type { MaplaceOptions } from "../options";
import type { ResolvedPopupOptions } from "../popup";

/** Popup options with the RFC defaults, as adapters receive them. */
export function resolvePopup(options: MaplaceOptions | undefined): ResolvedPopupOptions {
  const popup = options?.popup;
  const [x, y] = popup?.offset ?? [0, 0];
  const offset: readonly [number, number] = Object.freeze([x, y]);
  return Object.freeze({ maxWidth: popup?.maxWidth, offset, openOn: popup?.openOn ?? "click" });
}
