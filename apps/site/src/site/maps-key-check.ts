import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

/** The variables a build reads: the site's `.env` files, then the process's. */
type Env = Readonly<Record<string, string | undefined>>;

/** What Astro hands the hook, as far as the check uses it. */
interface ConfigSetup {
  readonly command: string;
  readonly config: { readonly root: URL };
  readonly logger: { warn(message: string): void };
}

/** Where `astro:env` reads a build's variables: the root's `.env` files, then the process. */
function buildEnv(root: string): Env {
  return { ...loadEnv("production", root, ""), ...process.env };
}

/**
 * An Astro integration that warns when a build has no Maps key, since each map would say so
 * once a visitor loads it. Dev usually has none, so it stays quiet there.
 */
export function mapsKeyCheck(env: (root: string) => Env = buildEnv) {
  return {
    name: "maps-key-check",
    hooks: {
      "astro:config:setup"({ command, config, logger }: ConfigSetup): void {
        if (command !== "build" || env(fileURLToPath(config.root)).SITE_MAPS_KEY) return;
        logger.warn(
          "SITE_MAPS_KEY isn't set: once a visitor loads the maps, each will say the site has no key.",
        );
      },
    },
  };
}
