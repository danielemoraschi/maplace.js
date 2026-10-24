/**
 * Marks `row`, a sticky element, `data-stuck` while it is held at its sticky top, for a browser
 * without scroll-state queries (Safari and Firefox): the site's `stuck:` variant reads either.
 * Checked once a frame at most, on scroll and resize.
 */
export function markWhenStuck(row: HTMLElement): void {
  const view = row.ownerDocument.defaultView;
  if (view === null) return;
  let queued = false;
  const check = () => {
    queued = false;
    const held = Number.parseFloat(view.getComputedStyle(row).top);
    row.toggleAttribute("data-stuck", row.getBoundingClientRect().top <= held + 0.5);
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    view.requestAnimationFrame(check);
  };
  view.addEventListener("scroll", queue, { passive: true });
  view.addEventListener("resize", queue, { passive: true });
  queue();
}
