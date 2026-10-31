/**
 * A failed read's message, and its cause's: Node's `fetch failed` says why only in its cause, and
 * a connection refused at every address of a host only in that cause's `code`.
 */
export function reasonOf(error: unknown): string {
  const { message, cause } = error as Error;
  if (!(cause instanceof Error)) return message;
  return `${message} (${cause.message || (cause as NodeJS.ErrnoException).code})`;
}
