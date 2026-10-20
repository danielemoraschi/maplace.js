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
 * once a visitor loads it, or no map ID, since each map would run on Google's demo one and
 * warn of it. Dev usually has neither, so it stays quiet there.
 */
export function mapsSettingsCheck(env: (root: string) => Env = buildEnv) {
  return {
    name: "maps-settings-check",
    hooks: {
      "astro:config:setup"({ command, config, logger }: ConfigSetup): void {
        if (command !== "build") return;
        const { SITE_MAPS_KEY, SITE_MAPS_MAP_ID } = env(fileURLToPath(config.root));
        if (!SITE_MAPS_KEY) {
          logger.warn(
            "SITE_MAPS_KEY isn't set: once a visitor loads the maps, each will say the site has no key.",
          );
        }
        if (!SITE_MAPS_MAP_ID) {
          logger.warn(
            "SITE_MAPS_MAP_ID isn't set: the maps will run on Google's DEMO_MAP_ID and warn of it.",
          );
        }
      },
    },
  };
}
