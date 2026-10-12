/**
 * Runs code the store doesn't own (a listener, an adapter method). Its bug must not stop the
 * store or leave it half-updated, and it must not vanish either: rethrown in a microtask, it
 * reaches the console and `window.onerror`.
 */
export function runSafely<R>(action: () => R): R | undefined {
  try {
    return action();
  } catch (error) {
    queueMicrotask(() => {
      throw error;
    });
    return undefined;
  }
}
