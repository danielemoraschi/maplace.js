/** Copies `text`, saying whether it could: a page off HTTPS, or a refusal, has no clipboard. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
