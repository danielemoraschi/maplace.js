import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { cdp, page } from "vitest/browser";
import { mapFrom, ROME, styledPage } from "./testing/fake-maps";
import { restoreScreen, showOnDesktop, showOnPhone } from "./testing/screens";

// The look the assertions can't judge is read by eye, in `.vitest/load-panel/`, gitignored: at each
// width, light and dark. The site never shows the panel (frame.css), so this page is its only look.

const PAGE = `
:root { color-scheme: light dark; font-family: system-ui; }
body { margin: 16px; }
maplace-map { margin-block-end: 16px; }
#rome .maplace-load-panel { background: url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#cfe3d4"/><path d="M0 20H40M20 0V40" stroke="#fff" stroke-width="4"/></svg>',
)}"); }
#rome .maplace-load-panel > * { padding: .25rem .5rem; background: Canvas; color: CanvasText; }
`;

const BODY = `
<maplace-map hold provider="fake">${ROME}</maplace-map>
<maplace-map hold provider="fake" id="rome">${ROME}</maplace-map>
`;

const SCREENS = [
  { width: 1280, show: showOnDesktop },
  { width: 375, show: showOnPhone },
];
const SCHEMES = [
  { scheme: "light", text: "rgb(0, 0, 0)" },
  { scheme: "dark", text: "rgb(255, 255, 255)" },
];

const CASES = SCREENS.flatMap((screen) => SCHEMES.map((scheme) => ({ ...screen, ...scheme })));

async function emulateScheme(value: string): Promise<void> {
  const session = cdp();
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value }],
  });
  onTestFinished(async () => {
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  });
}

afterEach(() => document.body.replaceChildren());

describe("The load panel's look", () => {
  it.each(CASES)(
    "at $width in $scheme: no horizontal scroll, the button inside the screen and at least 24px tall, text and button in the page's colour",
    async ({ width, show, scheme, text }) => {
      await show();
      onTestFinished(restoreScreen);
      await emulateScheme(scheme);
      styledPage(PAGE);
      const map = await mapFrom(BODY);
      const button = map.querySelector(".maplace-load-panel>button") as HTMLElement;
      const line = map.querySelector(".maplace-load-panel>span") as HTMLElement;
      const { left, right, height } = button.getBoundingClientRect();
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(innerWidth);
      expect(height).toBeGreaterThanOrEqual(24);
      expect(getComputedStyle(line).color).toBe(text);
      expect(getComputedStyle(button).color).toBe(text);
      await page.screenshot({
        path: `../../../../.vitest/load-panel/${width}-${scheme}.png`,
        element: document.documentElement,
      });
    },
  );
});
