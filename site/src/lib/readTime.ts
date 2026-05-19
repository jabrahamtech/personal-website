// Compute reading time from raw markdown / MDX body. Strips fenced code,
// inline code, HTML/JSX tags, and link/image syntax before counting so what
// gets measured is prose length, not markup. 230 wpm matches Medium's
// published reading-speed assumption.
export function computeWordCount(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function computeReadTime(body: string): string {
  const words = computeWordCount(body);
  const minutes = Math.max(1, Math.round(words / 230));
  return `~ ${minutes} min`;
}
