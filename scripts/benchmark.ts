import { type Agent, greedyAgent, playHeadless, randomAgent, searchAgent } from '../src/engine/headless'
import { createRng } from '../src/engine/rng'
import type { Player } from '../src/engine/types'

// Usage: npm run benchmark -- [games] [ms per move] [seed]
const games = Number(process.argv[2] ?? 20)
const ms = Number(process.argv[3] ?? 100)
const seed = Number(process.argv[4] ?? 1)
const level = { id: 'hard' as const, label: 'Benchmark', blurb: '', ms, maxDepth: 12, accuracy: 0.8, blunder: 0 }

const baselines: [string, () => Agent][] = [
  ['random', () => randomAgent(0.8)],
  ['greedy', () => greedyAgent(0.8)],
]

console.log(`Bot at ${ms} ms per move vs baselines, ${games} games each, seats alternate\n`)

for (const [name, make] of baselines) {
  const rng = createRng(seed)
  let wins = 0
  let margin = 0

  for (let g = 0; g < games; g++) {
    const seat = (g % 2) as Player
    const agents: [Agent, Agent] = seat === 0 ? [searchAgent(level), make()] : [make(), searchAgent(level)]
    const outcome = playHeadless(agents, rng)
    if (outcome.winner === seat) wins++
    margin += seat === 0 ? outcome.margin : -outcome.margin
  }

  console.log(`vs ${name.padEnd(7)} wins ${wins}/${games}   average margin ${(margin / games).toFixed(1)} EV`)
}
