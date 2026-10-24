/** `access`'s result, or undefined when the browser refuses its site data (a blocked storage throws). */
export function attempt<T>(access: () => T): T | undefined {
  try {
    return access();
  } catch {
    return undefined;
  }
}
