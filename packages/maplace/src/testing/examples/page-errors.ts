// What goes wrong on an example's page while it runs: what a run expects to be nothing.

let stopRecording: (() => void) | undefined;

/** Records what goes wrong on the page from now until the next call: errors and `maplace-error`s. */
export function recordErrors(): unknown[] {
  stopRecording?.();
  const errors: unknown[] = [];
  const record = (event: Event) => errors.push(detailOf(event));
  const events = ["error", "unhandledrejection", "maplace-error"] as const;
  for (const name of events) globalThis.addEventListener(name, record);
  stopRecording = () => {
    for (const name of events) globalThis.removeEventListener(name, record);
  };
  return errors;
}

function detailOf(event: Event): unknown {
  if (event instanceof ErrorEvent) return event.error ?? event.message;
  if (event instanceof PromiseRejectionEvent) return event.reason;
  return (event as CustomEvent).detail;
}
