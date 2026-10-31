import { createHash } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { reasonOf } from "./error-reason.ts";
import { filesInTarball } from "./tarball-files.ts";

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** The manifest's version until the first release (R2), never on npm. */
export const UNPUBLISHED_VERSION = "0.0.0";

/** The package's name, as `PINNED_SCRIPT` and the release workflow write it. */
export const PACKAGE_NAME = "maplace";

/** Long enough for a tarball of a few MB; a black-holed network fails rather than hangs. */
export const READ_TIMEOUT_MS = 30_000;

const READ_TRIES = 3;
const READ_RETRY_PAUSE_MS = 2_000;

/** The longest `publishedFiles` can take: two reads, metadata and tarball, each out of tries. */
export const LONGEST_NPM_READ_MS =
  2 * (READ_TRIES * READ_TIMEOUT_MS + (READ_TRIES - 1) * READ_RETRY_PAUSE_MS);

/**
 * A version's files as npm holds them, the tarball checked against the registry's own integrity;
 * `undefined` when npm hasn't that version: `UNPUBLISHED_VERSION` with no network, or a 404 on its
 * metadata. Anything else rejects, naming the version: what was published isn't known then.
 */
export async function publishedFiles(
  version: string,
  fetchUrl: Fetch,
): Promise<ReadonlyMap<string, Uint8Array> | undefined> {
  if (version === UNPUBLISHED_VERSION) return undefined;
  try {
    return await filesOnNpm(version, fetchUrl);
  } catch (error) {
    throw new Error(
      `${PACKAGE_NAME}@${version} can't be read from npm, so what it published isn't known: ${reasonOf(error)}`,
      { cause: error },
    );
  }
}

async function filesOnNpm(
  version: string,
  fetchUrl: Fetch,
): Promise<ReadonlyMap<string, Uint8Array> | undefined> {
  const metadata = await readWithRetries(
    `https://registry.npmjs.org/${PACKAGE_NAME}/${version}`,
    fetchUrl,
  );
  if (metadata.status === 404) return undefined;
  if (metadata.status !== 200) throw new Error(`npm answered ${metadata.status}`);
  const { tarball, integrity } = distOf(JSON.parse(new TextDecoder().decode(metadata.bytes)));
  const download = await readWithRetries(tarball, fetchUrl);
  if (download.status !== 200) throw new Error(`npm answered ${download.status} for ${tarball}`);
  assertIntegrity(download.bytes, integrity);
  return filesInTarball(download.bytes);
}

interface Read {
  readonly status: number;
  readonly bytes: Uint8Array;
}

/** One whole read, its body included, again only on a failure (a timeout too) or a 5xx. */
async function readWithRetries(url: string, fetchUrl: Fetch): Promise<Read> {
  for (let triesLeft = READ_TRIES - 1; triesLeft > 0; triesLeft--) {
    const read = await readOnce(url, fetchUrl).catch(() => undefined);
    if (read !== undefined && read.status < 500) return read;
    await pause(READ_RETRY_PAUSE_MS);
  }
  return readOnce(url, fetchUrl);
}

async function readOnce(url: string, fetchUrl: Fetch): Promise<Read> {
  const response = await fetchUrl(url, { signal: AbortSignal.timeout(READ_TIMEOUT_MS) });
  return { status: response.status, bytes: new Uint8Array(await response.arrayBuffer()) };
}

function distOf(metadata: unknown): { tarball: string; integrity: string } {
  const dist = (metadata as { dist?: { tarball?: unknown; integrity?: unknown } } | null)?.dist;
  const { tarball, integrity } = dist ?? {};
  if (typeof tarball !== "string" || typeof integrity !== "string") {
    throw new TypeError("npm's metadata has no dist with a tarball and an integrity");
  }
  return { tarball, integrity };
}

function assertIntegrity(bytes: Uint8Array, integrity: string): void {
  const actual = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  if (actual !== integrity) {
    throw new Error(`the tarball is ${actual}, and npm's metadata says ${integrity}`);
  }
}
