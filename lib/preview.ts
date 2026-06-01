/**
 * Return the leading ~fraction of a markdown body, cut at the nearest
 * paragraph boundary (double-newline) at or before the target offset.
 * Always a prefix of `body`; never returns the whole body when fraction < 1.
 */
export function previewSlice(body: string, fraction = 0.24): string {
  const target = Math.floor(body.length * fraction);
  if (target <= 0) return "";
  const paras = body.split(/\n\n+/);
  let acc = "";
  for (let i = 0; i < paras.length; i++) {
    const next = acc.length === 0 ? paras[i] : acc + "\n\n" + paras[i];
    if (next.length > target && acc.length > 0) break;
    acc = next;
    if (acc.length >= target) break;
  }
  if (acc.length >= body.length && paras.length > 1) {
    acc = paras.slice(0, -1).join("\n\n");
  }
  return acc;
}
