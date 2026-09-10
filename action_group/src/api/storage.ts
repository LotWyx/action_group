// Thin localStorage-backed collection store used by the mock API layer.
// Every collection is namespaced so multiple demo datasets never collide,
// and a version prefix lets us bump the seed without manual migration.

const NS = 'prz:v1:'

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function loadCollection<T>(name: string, seedFactory: () => T[]): T[] {
  const key = NS + name
  const raw = localStorage.getItem(key)
  if (raw) {
    try {
      return JSON.parse(raw) as T[]
    } catch {
      // fall through to reseed on corrupt data
    }
  }
  const seeded = seedFactory()
  localStorage.setItem(key, JSON.stringify(seeded))
  return seeded
}

export function saveCollection<T>(name: string, items: T[]): void {
  localStorage.setItem(NS + name, JSON.stringify(items))
}

export function resetAllData(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(NS))
    .forEach((k) => localStorage.removeItem(k))
}

/** Simulated network latency so loading states are visible and the code is
 * already shaped for real async calls once FastAPI replaces this layer. */
export function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
