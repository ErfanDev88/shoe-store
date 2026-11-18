import { randomBytes } from 'crypto';

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/** Builds a URL slug from latin text and makes it unique via the `exists` callback. */
export async function uniqueSlug(base: string | undefined, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base ?? '') || `item-${randomBytes(3).toString('hex')}`;
  let candidate = root;
  while (await exists(candidate)) candidate = `${root}-${randomBytes(2).toString('hex')}`;
  return candidate;
}

export const isDuplicateKey = (e: unknown) => (e as { code?: number })?.code === 11000;
