export interface Rng {
  next(): number
  int(n: number): number
  chance(p: number): boolean
  shuffle<T>(items: T[]): T[]
}

export function createRng(seed?: number): Rng {
  let a = (seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0

  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n: number) => Math.floor(next() * n)

  return {
    next,
    int,
    chance: (p) => next() < p,
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[items[i], items[j]] = [items[j], items[i]]
      }
      return items
    },
  }
}
