import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { type PreviewServer, preview } from "vite";
import { ROOT } from "../../../scripts/build/package.ts";
import { newTempDir, removeTempDir } from "../../../scripts/build/temp-dir.ts";

const SITE = resolve(ROOT, "apps/site");
const ASTRO = resolve(ROOT, "node_modules/.bin/astro");
const run = promisify(execFile);

/** The site, built into a temp dir and served there. */
export interface BuiltSite {
  readonly url: string;
  close(): Promise<void>;
}

/**
 * Builds the site with `env` added (in a child process: Astro runs its own Vite) and serves it
 * statically. A failed build throws with Astro's output.
 */
export async function buildAndServeSite(env: Record<string, string>): Promise<BuiltSite> {
  const dir = newTempDir("site", join(ROOT, ".vitest"));
  try {
    await buildSite(dir, env);
    const server = await serve(dir);
    return {
      url: server.resolvedUrls?.local[0] ?? "",
      async close() {
        await server.close();
        removeTempDir(dir);
      },
    };
  } catch (error) {
    removeTempDir(dir);
    throw error;
  }
}

/** Astro logs a failed build to stdout: the error carries both streams. */
async function buildSite(outDir: string, env: Record<string, string>): Promise<void> {
  try {
    await run(ASTRO, ["build", "--outDir", outDir], { cwd: SITE, env: { ...process.env, ...env } });
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    throw new Error(`the site failed to build:\n${stdout}${stderr}`, { cause: error });
  }
}

function serve(dir: string): Promise<PreviewServer> {
  return preview({
    configFile: false,
    logLevel: "silent",
    root: dir,
    build: { outDir: "." },
    preview: { host: "127.0.0.1", port: 4390 },
  });
}
