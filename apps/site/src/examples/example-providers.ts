import type { Provider } from "../../../../packages/maplace/src/testing/examples/example-files.ts";

export type { Provider } from "../../../../packages/maplace/src/testing/examples/example-files.ts";

interface ProviderLabel {
  readonly provider: Provider;
  readonly label: string;
}

/**
 * The providers, in the order the site offers them, each with its name there: MapLibre first, so a
 * visit loads no billed Google map unless the visitor asks for one.
 */
export const PROVIDER_LABELS: readonly [ProviderLabel, ...ProviderLabel[]] = [
  { provider: "maplibre", label: "MapLibre" },
  { provider: "google", label: "Google" },
];

/** The provider the examples run on until the visitor chooses another. */
export const FIRST_PROVIDER: Provider = PROVIDER_LABELS[0].provider;

/** Whether `value` names one of the providers. */
export function isProvider(value: string): value is Provider {
  return PROVIDER_LABELS.some(({ provider }) => provider === value);
}

/**
 * The folder, under `packages/maplace/examples/`, of the example `name`'s versions on `provider`:
 * Google's in the example's own, MapLibre's in its `maplibre` folder.
 */
export function exampleFolder(name: string, provider: Provider): string {
  return provider === "google" ? name : `${name}/maplibre`;
}
