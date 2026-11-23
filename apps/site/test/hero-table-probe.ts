// What the home page's tests read of its hero's table (W66), run in the page.

/**
 * The table's cards more than about 30px under any of the copy's text, the prototype's rule, by
 * name: sampled along the middle of each line it draws short of its last 30px, the cards made to
 * take the pointer while it looks (they take none, and a hit test skips them).
 */
export function cardsUnderCopy(): string[] {
  const allowed = 30;
  const copy = document.querySelector('[data-version-switch="ways-in"] > div');
  const texts = [
    ...(copy?.querySelectorAll("h1, p, code, a") ?? []),
    // The four ways' tabs, the table beside them.
    ...document.querySelectorAll('[aria-label="Ways to use Maplace.js"] [role="tab"]'),
  ];
  const lines = texts.flatMap((text) => {
    const range = document.createRange();
    range.selectNodeContents(text);
    return [...range.getClientRects()];
  });
  const points = lines.flatMap((line) =>
    Array.from(
      { length: Math.max(0, Math.floor((line.width - allowed) / 16)) + 1 },
      (_, step) => [line.left + step * 16, line.top + line.height / 2] as const,
    ),
  );
  const hittable = document.createElement("style");
  hittable.textContent = "[data-hero-card] { pointer-events: auto }";
  document.head.append(hittable);
  const cards = points
    .flatMap(([x, y]) => document.elementsFromPoint(x, y))
    .map((hit) => hit.closest<HTMLElement>("[data-hero-card]")?.dataset.heroCard)
    .filter((name) => name !== undefined);
  hittable.remove();
  return [...new Set(cards)];
}

/**
 * Of the cards `names`, those no part of which shows on the screen below the page's header and
 * above the hero's foot: sampled every 16px, the cards made to take the pointer while it looks.
 */
export function cardsUnseen(names: readonly string[]): string[] {
  const top = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  const bottom = document.querySelector(".hero-water")?.getBoundingClientRect().bottom ?? 0;
  const hittable = document.createElement("style");
  hittable.textContent = "[data-hero-card] { pointer-events: auto }";
  document.head.append(hittable);
  const seen = new Set<string>();
  for (let y = top + 4; y < bottom; y += 16) {
    for (let x = 0; x < innerWidth; x += 16) {
      const card = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-hero-card]");
      if (card?.dataset.heroCard !== undefined) seen.add(card.dataset.heroCard);
    }
  }
  hittable.remove();
  return names.filter((name) => !seen.has(name));
}

/**
 * The transform functions the table rests on and those of each frame of its turn, by name, as the
 * page's stylesheets hold them, `@layer` blocks and all.
 */
export function tableTurnFunctions(): { resting: string[]; frames: string[][] } {
  const withNested = (rule: CSSRule): CSSRule[] =>
    rule instanceof CSSGroupingRule ? [rule, ...[...rule.cssRules].flatMap(withNested)] : [rule];
  const rules = [...document.styleSheets].flatMap((sheet) =>
    [...sheet.cssRules].flatMap(withNested),
  );
  const functionNames = (transform: string) => transform.match(/\w+(?=\()/g) ?? [];
  const resting = rules.find(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === ".table-turn",
  );
  const turn = rules.find(
    (rule): rule is CSSKeyframesRule =>
      rule instanceof CSSKeyframesRule && rule.name === "table-turn",
  );
  const frames = [...(turn?.cssRules ?? [])] as CSSKeyframeRule[];
  return {
    resting: functionNames(resting?.style.transform ?? ""),
    frames: frames.map((frame) => functionNames(frame.style.transform)),
  };
}
