/** Resolves once `count` frames have been drawn. */
export async function frames(count: number): Promise<void> {
  for (let frame = 0; frame < count; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
