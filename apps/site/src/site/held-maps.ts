import { PROVIDER_LABELS, type Provider } from "../examples/example-providers.ts";
import { PROVIDER_MARKUP } from "../examples/provider-markup.ts";
import type { SiteMapSettings } from "../examples/site-map-settings.ts";

/** One provider's held map, empty: its locations come from the page's own script. */
interface HeldMapMarkup {
  readonly provider: Provider;
  readonly markup: string;
}

/** The map as an example writes it: Google's rewrite wants the reader's placeholder key. */
const EMPTY_MAP: Readonly<Record<Provider, string>> = {
  google: '<maplace-map api-key="YOUR_KEY"></maplace-map>',
  maplibre: "<maplace-map></maplace-map>",
};

/** A held map per provider, in the order the site offers them, with the site's settings. */
export function heldMapsMarkup(settings: SiteMapSettings): readonly HeldMapMarkup[] {
  return PROVIDER_LABELS.map(({ provider }) => ({
    provider,
    markup: PROVIDER_MARKUP[provider](settings).holdMap(EMPTY_MAP[provider]),
  }));
}
