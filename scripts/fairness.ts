import { greedyAgent, playHeadless, searchAgent } from '../src/engine/headless'
import { createRng } from '../src/engine/rng'

// Usage: npm run fairness -- [games] [search ms per move]
// Equal players should win about half of their games whichever of them acts first.
const games = Number(process.argv[2] ?? 400)
const ms = Number(process.argv[3] ?? 0)
const level = { id: 'hard' as const, label: 'Fairness', blurb: '', ms, maxDepth: 12, accuracy: 0.8, blunder: 0 }
const make = () => (ms > 0 ? searchAgent(level) : greedyAgent(0.8))

const rng = createRng(11)
let starterWins = 0
let margin = 0

for (let g = 0; g < games; g++) {
  const outcome = playHeadless([make(), make()], rng)
  if (outcome.winner === outcome.starter) starterWins++
  margin += outcome.starter === 0 ? outcome.margin : -outcome.margin
}

const kind = ms > 0 ? `search bots at ${ms} ms per move` : 'greedy bots'
console.log(`${games} games between equal ${kind}`)
console.log(`player who acts first wins ${((starterWins / games) * 100).toFixed(1)}% of games, average margin ${(margin / games).toFixed(1)} EV`)
