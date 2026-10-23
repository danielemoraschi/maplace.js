import type { Provider } from "../examples/example-providers.ts";

/** What each provider's CDN script sets as the page's `Maplace`, imported on demand (W33). */
export type MaplaceImports = Readonly<Record<Provider, () => Promise<object>>>;

/**
 * What puts each provider's `Maplace` on `target`: merged with what is there, since both
 * providers' maps share one page and a script that ran earlier may call its functions later.
 * Installing again changes nothing, and the module loader imports each entry once.
 */
export function maplaceInstaller(
  imports: MaplaceImports,
  target: { Maplace?: object },
): (provider: Provider) => Promise<void> {
  return async (provider) => {
    const entries = await imports[provider]();
    target.Maplace = Object.assign(target.Maplace ?? {}, entries);
  };
}
