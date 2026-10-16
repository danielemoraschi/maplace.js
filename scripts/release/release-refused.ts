/** Why a version can't be released, in words a person acts on. */
export class ReleaseRefused extends Error {
  override readonly name = "ReleaseRefused";
}
