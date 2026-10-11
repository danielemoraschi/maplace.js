/**
 * Registers the `google` provider for `<maplace-map>`; the CDN builds are this entry bundled.
 *
 * Provider attributes: `api-key`, `map-id`, `version`, `language`, `region`, `nonce`.
 * Injects Google's bootstrap once per page when Maps isn't loaded yet; conflicting loader
 * attributes on a second element are misuse (error state + `maplace-error`).
 */
export type { MaplaceMapElement } from "./index";
