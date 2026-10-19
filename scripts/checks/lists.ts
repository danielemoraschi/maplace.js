/** The `candidates` that `list` lacks, in their order. */
export function missingFrom(list: readonly string[], candidates: readonly string[]): string[] {
  return candidates.filter((candidate) => !list.includes(candidate));
}
