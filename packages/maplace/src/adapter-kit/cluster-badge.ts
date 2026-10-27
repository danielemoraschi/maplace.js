import { outsideUnstyled } from "../unstyled";

/** The class of every cluster's badge, whichever provider draws it, for a page's own rules. */
export const CLUSTER_CLASS = "maplace-cluster";

/**
 * The badge's default look: the count in a blue round badge, its colours from
 * `--maplace-cluster-background` and `--maplace-cluster-color` when the page sets them on the map
 * or anything above it. In `:where()`, so any rule of the page wins, and off inside the opt-out
 * (`unstyled.ts`).
 */
export const CLUSTER_STYLES = `
${outsideUnstyled(`.${CLUSTER_CLASS}`)}{min-width:32px;height:32px;padding:0 6px;box-sizing:border-box;border-radius:16px;border:2px solid #fff;background:var(--maplace-cluster-background,#1a73e8);color:var(--maplace-cluster-color,#fff);font:600 13px/28px system-ui,sans-serif;text-align:center}
`;

/** A cluster's accessible name: how many locations it stands for. */
export function clusterLabel(count: number): string {
  return `Cluster of ${count} locations`;
}

/** The number of locations in a badge, styled by `CLUSTER_STYLES`: every adapter's cluster. */
export function countBadge(document: Document, count: number): HTMLElement {
  const badge = document.createElement("div");
  badge.className = CLUSTER_CLASS;
  badge.textContent = String(count);
  return badge;
}
