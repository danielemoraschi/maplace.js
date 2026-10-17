/** A package manifest, as far as its `repository` goes. */
interface WithRepository {
  readonly [field: string]: unknown;
}

/** `git+https://github.com/owner/repo.git` (npm's form) or `https://github.com/owner/repo`. */
const GITHUB_URL = /^(?:git\+)?https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?$/;

/** The repo's page on GitHub, from the manifest's `repository`. */
export function repositoryPageFor(manifest: WithRepository): string {
  const repository = GITHUB_URL.exec(repositoryUrl(manifest) ?? "")?.[1];
  if (repository === undefined) throw new Error("the package manifest names no GitHub repository");
  return `https://github.com/${repository}`;
}

/** Where the repo's files are at `tag`, from the manifest's `repository`. */
export function blobBaseFor(manifest: WithRepository, tag: string): string {
  return `${repositoryPageFor(manifest)}/blob/${tag}/`;
}

function repositoryUrl({ repository }: WithRepository): string | undefined {
  const url = (repository as { url?: unknown } | undefined)?.url;
  return typeof url === "string" ? url : undefined;
}
