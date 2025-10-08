export function canonicalTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupe<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  
  for (const it of items) {
    const key = canonicalTitle(it.title);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  
  return out;
}
