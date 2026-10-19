import { onTestFinished } from "vitest";

/** A dark page for this test: its scheme and light text, which the map's panels must not take. */
export function darkPage(): void {
  const root = document.documentElement.style;
  const body = document.body.style;
  const before = { colorScheme: root.colorScheme, color: body.color };
  root.colorScheme = "dark";
  body.color = "rgb(240, 240, 240)";
  onTestFinished(() => {
    root.colorScheme = before.colorScheme;
    body.color = before.color;
  });
}
