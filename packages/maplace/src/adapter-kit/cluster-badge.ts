/** A cluster's accessible name: how many locations it stands for. */
export function clusterLabel(count: number): string {
  return `Cluster of ${count} locations`;
}

/** The number of locations, in a round badge: every adapter's cluster marker. */
export function countBadge(document: Document, count: number): HTMLElement {
  const badge = document.createElement("div");
  badge.textContent = String(count);
  Object.assign(badge.style, {
    minWidth: "32px",
    height: "32px",
    padding: "0 6px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "2px solid #fff",
    background: "#1a73e8",
    color: "#fff",
    font: "600 13px/28px system-ui, sans-serif",
    textAlign: "center",
  });
  return badge;
}
