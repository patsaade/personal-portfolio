// Minimal stand-in for the Astro `astro:content` virtual module, used only
// during unit tests (see vitest.config.ts). Real behavior is exercised by the
// Astro build itself, not here.
export async function getCollection(): Promise<unknown[]> {
  return [];
}

export function defineCollection<T>(config: T): T {
  return config;
}

export type CollectionEntry<_T extends string> = {
  id: string;
  body?: string;
  data: Record<string, unknown>;
};

export const z = new Proxy({}, { get: () => () => ({}) });
