/**
 * `run`, scheduled at most once at a time: the calls made in one task run it once, in a microtask
 * after them, so changes a page makes together are taken together.
 */
export function oncePerTask(run: () => void): () => void {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      run();
    });
  };
}
