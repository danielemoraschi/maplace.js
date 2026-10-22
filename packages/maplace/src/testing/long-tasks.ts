/** The longest task the browser reports while `work` runs, in whole milliseconds. */
export async function longestTaskDuring(work: () => Promise<void>): Promise<number> {
  const tasks: number[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) tasks.push(entry.duration);
  });
  observer.observe({ type: "longtask" });
  try {
    await work();
    // Long tasks are reported after they end, in a later task.
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    observer.disconnect();
  }
  return Math.round(Math.max(0, ...tasks));
}
