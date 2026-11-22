/**
 * The channels of an opaque computed `rgb()` or `rgba()` colour, 0 to 255. A translucent one
 * throws: its contrast depends on what's under it, and transparent would read as black.
 */
function channelsOf(colour: string): [number, number, number] {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(colour);
  if (match === null) throw new Error(`${colour} isn't a computed rgb() colour`);
  if (match[4] !== undefined && Number(match[4]) < 1)
    throw new Error(`${colour} is translucent: its contrast depends on what's under it`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** WCAG's relative luminance of `colour`. */
function luminanceOf(colour: string): number {
  const [red, green, blue] = channelsOf(colour).map((channel) => {
    const share = channel / 255;
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG's contrast ratio of two computed colours, 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const [first, second] = [luminanceOf(foreground), luminanceOf(background)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
